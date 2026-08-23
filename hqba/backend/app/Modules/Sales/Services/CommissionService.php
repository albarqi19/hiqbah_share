<?php

namespace App\Modules\Sales\Services;

use App\Modules\Orders\Models\Order;
use App\Modules\Sales\Enums\CommissionStatus;
use App\Modules\Sales\Enums\CommissionType;
use App\Modules\Sales\Events\CommissionCreated;
use App\Modules\Sales\Models\Commission;
use App\Modules\Sales\Models\CommissionRule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CommissionService
{
    // ── Commission Calculation ──

    public function calculateCommission(Order $order): ?Commission
    {
        $repId = $order->sales_rep_id ?? $order->customer?->sales_rep_id;
        if (! $repId) {
            return null;
        }

        // Idempotency: check if already exists
        $existing = Commission::where('order_id', $order->id)
            ->where('sales_rep_id', $repId)
            ->whereNot('status', CommissionStatus::Reversed)
            ->whereNot('status', CommissionStatus::Cancelled)
            ->first();

        if ($existing) {
            return $existing;
        }

        $rule = $this->findApplicableRule($repId, $order);
        if (! $rule) {
            return null;
        }

        $amount = $this->calculateAmount($rule, $order);
        if ($amount <= 0) {
            return null;
        }

        $commission = Commission::create([
            'order_id' => $order->id,
            'sales_rep_id' => $repId,
            'commission_rule_id' => $rule->id,
            'order_total' => $order->total,
            'commission_amount' => $amount,
            'calculation_method' => $rule->type->value,
            'calculation_value' => $rule->value,
            'status' => CommissionStatus::Pending,
        ]);

        CommissionCreated::dispatch($commission);

        return $commission;
    }

    public function reverseCommission(Order $order, int $userId): ?Commission
    {
        $original = Commission::where('order_id', $order->id)
            ->whereIn('status', [CommissionStatus::Pending, CommissionStatus::Approved, CommissionStatus::Paid])
            ->first();

        if (! $original) {
            return null;
        }

        return DB::transaction(function () use ($original, $userId) {
            // Create reversal record
            $reversal = Commission::create([
                'order_id' => $original->order_id,
                'sales_rep_id' => $original->sales_rep_id,
                'commission_rule_id' => $original->commission_rule_id,
                'order_total' => $original->order_total,
                'commission_amount' => -$original->commission_amount,
                'calculation_method' => $original->calculation_method,
                'calculation_value' => $original->calculation_value,
                'status' => CommissionStatus::Reversed,
                'reversed_by_id' => $original->id,
                'notes' => 'عكس عمولة بسبب إلغاء/إرجاع الطلب',
            ]);

            // Update original
            $original->update([
                'status' => CommissionStatus::Reversed,
                'reversed_by_id' => $reversal->id,
            ]);

            return $reversal;
        });
    }

    // ── Approval Flow ──

    public function approve(Commission $commission, int $approverId): Commission
    {
        if ($commission->status !== CommissionStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن اعتماد عمولة بحالة ' . $commission->status->label()],
            ]);
        }

        $commission->update([
            'status' => CommissionStatus::Approved,
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);

        return $commission->fresh();
    }

    public function bulkApprove(array $ids, int $approverId): Collection
    {
        return DB::transaction(function () use ($ids, $approverId) {
            $commissions = Commission::whereIn('id', $ids)
                ->where('status', CommissionStatus::Pending)
                ->get();

            foreach ($commissions as $commission) {
                $commission->update([
                    'status' => CommissionStatus::Approved,
                    'approved_by' => $approverId,
                    'approved_at' => now(),
                ]);
            }

            return $commissions;
        });
    }

    public function reject(Commission $commission, int $approverId, string $reason): Commission
    {
        $commission->update([
            'status' => CommissionStatus::Cancelled,
            'approved_by' => $approverId,
            'approved_at' => now(),
            'notes' => $reason,
        ]);

        return $commission->fresh();
    }

    // ── Payment ──

    public function markPaid(Commission $commission, int $paidBy, ?string $paymentRef = null): Commission
    {
        if ($commission->status !== CommissionStatus::Approved) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن الدفع لعمولة غير معتمدة'],
            ]);
        }

        $commission->update([
            'status' => CommissionStatus::Paid,
            'paid_by' => $paidBy,
            'paid_at' => now(),
            'payment_reference' => $paymentRef,
        ]);

        return $commission->fresh();
    }

    public function bulkMarkPaid(array $ids, int $paidBy, ?string $paymentRef = null): Collection
    {
        return DB::transaction(function () use ($ids, $paidBy, $paymentRef) {
            $commissions = Commission::whereIn('id', $ids)
                ->where('status', CommissionStatus::Approved)
                ->get();

            foreach ($commissions as $commission) {
                $commission->update([
                    'status' => CommissionStatus::Paid,
                    'paid_by' => $paidBy,
                    'paid_at' => now(),
                    'payment_reference' => $paymentRef,
                ]);
            }

            return $commissions;
        });
    }

    // ── Queries ──

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Commission::class)
            ->allowedFilters([
                AllowedFilter::exact('sales_rep_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::scope('date_from', 'where', fn ($q, $v) => $q->where('created_at', '>=', $v)),
                AllowedFilter::scope('date_to', 'where', fn ($q, $v) => $q->where('created_at', '<=', $v)),
            ])
            ->allowedSorts(['created_at', 'commission_amount', 'status'])
            ->allowedIncludes(['order', 'salesRep', 'commissionRule'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function getRepSummary(int $repId, ?string $from = null, ?string $to = null): array
    {
        $query = Commission::where('sales_rep_id', $repId)
            ->whereNot('status', CommissionStatus::Reversed);

        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to);
        }

        return [
            'total_earned' => (float) (clone $query)->sum('commission_amount'),
            'total_pending' => (float) (clone $query)->where('status', CommissionStatus::Pending)->sum('commission_amount'),
            'total_approved' => (float) (clone $query)->where('status', CommissionStatus::Approved)->sum('commission_amount'),
            'total_paid' => (float) (clone $query)->where('status', CommissionStatus::Paid)->sum('commission_amount'),
        ];
    }

    // ── Rules ──

    public function listRules(): Collection
    {
        return CommissionRule::with('salesRep', 'createdBy')
            ->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function createRule(array $data): CommissionRule
    {
        return CommissionRule::create($data);
    }

    public function updateRule(CommissionRule $rule, array $data): CommissionRule
    {
        $rule->update($data);

        return $rule->fresh();
    }

    // ── Private Helpers ──

    private function findApplicableRule(int $repId, Order $order): ?CommissionRule
    {
        $customer = $order->customer;

        // 1. Rep-specific rule
        $rule = CommissionRule::active()
            ->where('sales_rep_id', $repId)
            ->where(function ($q) use ($order) {
                $q->whereNull('min_order_total')
                    ->orWhere('min_order_total', '<=', $order->total);
            })
            ->first();

        if ($rule) {
            return $rule;
        }

        // 2. Customer tier-specific rule
        if ($customer?->customer_tier) {
            $rule = CommissionRule::active()
                ->whereNull('sales_rep_id')
                ->where('customer_tier', $customer->customer_tier)
                ->where(function ($q) use ($order) {
                    $q->whereNull('min_order_total')
                        ->orWhere('min_order_total', '<=', $order->total);
                })
                ->first();

            if ($rule) {
                return $rule;
            }
        }

        // 3. Default rule (no rep, no tier)
        return CommissionRule::active()
            ->whereNull('sales_rep_id')
            ->whereNull('customer_tier')
            ->where(function ($q) use ($order) {
                $q->whereNull('min_order_total')
                    ->orWhere('min_order_total', '<=', $order->total);
            })
            ->first();
    }

    private function calculateAmount(CommissionRule $rule, Order $order): float
    {
        return match ($rule->type) {
            CommissionType::Percentage => round((float) $order->total * ((float) $rule->value / 100), 2),
            CommissionType::FixedPerOrder => (float) $rule->value,
            CommissionType::FixedPerKg => round($order->items()->sum('quantity') * (float) $rule->value, 2),
        };
    }
}
