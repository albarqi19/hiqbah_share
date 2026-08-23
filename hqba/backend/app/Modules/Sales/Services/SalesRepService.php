<?php

namespace App\Modules\Sales\Services;

use App\Modules\Orders\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Sales\Enums\CommissionStatus;
use App\Modules\Sales\Models\Commission;
use App\Modules\Sales\Models\Lead;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SalesRepService
{
    public function __construct(private CommissionService $commissionService) {}

    // ── Customer Assignment ──

    public function assignCustomer(int $customerId, int $repId): Customer
    {
        $customer = Customer::findOrFail($customerId);
        $customer->update(['sales_rep_id' => $repId]);

        return $customer->fresh();
    }

    public function bulkAssignCustomers(array $customerIds, int $repId): Collection
    {
        Customer::whereIn('id', $customerIds)->update(['sales_rep_id' => $repId]);

        return Customer::whereIn('id', $customerIds)->get();
    }

    // ── Dashboard Data ──

    public function getRepDashboard(int $repId): array
    {
        $customersCount = Customer::where('sales_rep_id', $repId)->where('is_active', true)->count();

        $ordersQuery = Order::where('sales_rep_id', $repId)
            ->orWhereHas('customer', fn ($q) => $q->where('sales_rep_id', $repId));

        $recentOrders = (clone $ordersQuery)
            ->with('customer')
            ->latest()
            ->take(10)
            ->get();

        $ordersThisMonth = (clone $ordersQuery)
            ->where('created_at', '>=', now()->startOfMonth())
            ->selectRaw('count(*) as count, coalesce(sum(total), 0) as total')
            ->first();

        $commissionSummary = $this->commissionService->getRepSummary($repId);

        $leadsByStage = Lead::where('sales_rep_id', $repId)
            ->selectRaw('stage, count(*) as count')
            ->groupBy('stage')
            ->pluck('count', 'stage')
            ->toArray();

        $totalLeads = Lead::where('sales_rep_id', $repId)->count();
        $convertedLeads = Lead::where('sales_rep_id', $repId)->where('stage', 'converted')->count();

        return [
            'my_customers_count' => $customersCount,
            'my_orders_count' => $ordersThisMonth->count ?? 0,
            'my_orders_total' => (float) ($ordersThisMonth->total ?? 0),
            'commissions' => $commissionSummary,
            'leads_by_stage' => $leadsByStage,
            'recent_orders' => $recentOrders,
            'conversion_rate' => $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 1) : 0,
        ];
    }

    public function getManagerDashboard(): array
    {
        $totalSalesThisMonth = Order::where('created_at', '>=', now()->startOfMonth())
            ->where('payment_status', 'paid')
            ->sum('total');

        $pendingApprovals = Commission::where('status', CommissionStatus::Pending)->count();

        $commissionPayable = Commission::where('status', CommissionStatus::Approved)
            ->sum('commission_amount');

        $repsPerformance = DB::table('users')
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'sales_rep')
            ->where('model_has_roles.model_type', 'App\\Core\\Models\\User')
            ->select('users.id', 'users.name', 'users.name_ar')
            ->get()
            ->map(function ($rep) {
                $ordersQuery = Order::where('sales_rep_id', $rep->id)
                    ->orWhereHas('customer', fn ($q) => $q->where('sales_rep_id', $rep->id));

                $monthOrders = (clone $ordersQuery)
                    ->where('orders.created_at', '>=', now()->startOfMonth())
                    ->selectRaw('count(*) as count, coalesce(sum(total), 0) as total')
                    ->first();

                $commissionEarned = Commission::where('sales_rep_id', $rep->id)
                    ->where('created_at', '>=', now()->startOfMonth())
                    ->whereNot('status', CommissionStatus::Reversed)
                    ->sum('commission_amount');

                $customersCount = Customer::where('sales_rep_id', $rep->id)->count();

                return [
                    'rep' => ['id' => $rep->id, 'name' => $rep->name, 'name_ar' => $rep->name_ar],
                    'orders_count' => $monthOrders->count ?? 0,
                    'orders_total' => (float) ($monthOrders->total ?? 0),
                    'commission_earned' => (float) $commissionEarned,
                    'customers_count' => $customersCount,
                ];
            });

        return [
            'total_sales_this_month' => (float) $totalSalesThisMonth,
            'pending_approvals_count' => $pendingApprovals,
            'commission_payable_total' => (float) $commissionPayable,
            'reps_performance' => $repsPerformance,
        ];
    }
}
