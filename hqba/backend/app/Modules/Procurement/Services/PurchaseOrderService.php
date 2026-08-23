<?php

namespace App\Modules\Procurement\Services;

use App\Core\Enums\ApprovalActionType;
use App\Core\Enums\ApprovalRequestStatus;
use App\Core\Models\ApprovalRequest;
use App\Core\Models\User;
use App\Core\Services\ApprovalService;
use App\Modules\Procurement\Enums\PurchaseOrderStatus;
use App\Modules\Procurement\Enums\RequisitionStatus;
use App\Modules\Procurement\Events\PurchaseOrderApproved;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Models\PurchaseOrderItem;
use App\Modules\Procurement\Models\PurchaseRequisition;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PurchaseOrderService
{
    public function __construct(
        protected ApprovalService $approvalService,
        protected PurchaseRequisitionService $requisitionService,
    ) {}

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(PurchaseOrder::class)
            ->allowedFilters([
                AllowedFilter::exact('supplier_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('created_by'),
                'po_number',
            ])
            ->allowedSorts(['po_number', 'created_at', 'expected_date', 'total_cost'])
            ->allowedIncludes(['supplier', 'creator', 'approver', 'items', 'goodsReceiptNotes'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    /**
     * Create a PO with one or more items.
     *
     * @param  array  $data  PO header (supplier_id, expected_date, currency, shipping_cost, customs_cost, notes, …)
     * @param  array  $items  list of items, each: origin_country, region, process, quantity_kg, price_per_kg, …
     */
    public function create(array $data, array $items, int $userId): PurchaseOrder
    {
        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => ['يجب إدخال بند واحد على الأقل في أمر الشراء.'],
            ]);
        }

        return DB::transaction(function () use ($data, $items, $userId) {
            $data['po_number'] = PurchaseOrder::generatePoNumber();
            $data['created_by'] = $userId;
            $data['status'] = $data['status'] ?? PurchaseOrderStatus::Draft->value;
            $data['shipping_cost'] = $data['shipping_cost'] ?? 0;
            $data['customs_cost'] = $data['customs_cost'] ?? 0;

            // Header gets summary spec from FIRST item for backward-compat & quick filters.
            $first = $items[0];
            $data['origin_country'] = $first['origin_country'] ?? null;
            $data['region'] = $first['region'] ?? null;
            $data['process'] = $first['process'] ?? null;
            $data['variety'] = $first['variety'] ?? null;
            $data['altitude'] = $first['altitude'] ?? null;
            $data['farm'] = $first['farm'] ?? null;

            $po = PurchaseOrder::create($data);

            foreach ($items as $item) {
                $subtotal = (float) ($item['quantity_kg'] ?? 0) * (float) ($item['price_per_kg'] ?? 0);
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'requisition_id' => $item['requisition_id'] ?? null,
                    'origin_country' => $item['origin_country'] ?? null,
                    'region' => $item['region'] ?? null,
                    'farm' => $item['farm'] ?? null,
                    'process' => $item['process'] ?? null,
                    'variety' => $item['variety'] ?? null,
                    'altitude' => $item['altitude'] ?? null,
                    'quantity_kg' => $item['quantity_kg'] ?? 0,
                    'price_per_kg' => $item['price_per_kg'] ?? 0,
                    'subtotal' => $subtotal,
                    'expected_cupping_score' => $item['expected_cupping_score'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // Header roll-up: total quantity & price (avg-weighted) for backward-compat
            $po->load('items');
            $po->quantity_kg = $po->items->sum('quantity_kg');
            $totalSubtotal = (float) $po->items->sum('subtotal');
            $po->price_per_kg = $po->quantity_kg > 0
                ? round($totalSubtotal / (float) $po->quantity_kg, 2)
                : 0;

            $po->calculateTotalCost();
            $po->save();

            return $po->fresh()->load(['supplier', 'items', 'creator']);
        });
    }

    public function update(PurchaseOrder $po, array $data, ?array $items = null): PurchaseOrder
    {
        if ($po->status !== PurchaseOrderStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن تعديل أمر الشراء بعد إرساله للاعتماد.'],
            ]);
        }

        return DB::transaction(function () use ($po, $data, $items) {
            $po->update($data);

            if ($items !== null) {
                $po->items()->delete();
                foreach ($items as $item) {
                    $subtotal = (float) ($item['quantity_kg'] ?? 0) * (float) ($item['price_per_kg'] ?? 0);
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $po->id,
                        'requisition_id' => $item['requisition_id'] ?? null,
                        'origin_country' => $item['origin_country'] ?? null,
                        'region' => $item['region'] ?? null,
                        'farm' => $item['farm'] ?? null,
                        'process' => $item['process'] ?? null,
                        'variety' => $item['variety'] ?? null,
                        'altitude' => $item['altitude'] ?? null,
                        'quantity_kg' => $item['quantity_kg'] ?? 0,
                        'price_per_kg' => $item['price_per_kg'] ?? 0,
                        'subtotal' => $subtotal,
                        'expected_cupping_score' => $item['expected_cupping_score'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }

            $po->load('items');
            $po->quantity_kg = $po->items->sum('quantity_kg');
            $totalSubtotal = (float) $po->items->sum('subtotal');
            $po->price_per_kg = $po->quantity_kg > 0
                ? round($totalSubtotal / (float) $po->quantity_kg, 2)
                : 0;
            $po->calculateTotalCost();
            $po->save();

            return $po->fresh()->load(['supplier', 'items']);
        });
    }

    public function delete(PurchaseOrder $po): void
    {
        if (! in_array($po->status, [PurchaseOrderStatus::Draft, PurchaseOrderStatus::Cancelled])) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن حذف أمر الشراء في حالة ' . $po->status->label()],
            ]);
        }

        $po->delete();
    }

    /**
     * Submit a draft PO for approval (creates an ApprovalRequest).
     */
    public function submit(PurchaseOrder $po, int $userId): PurchaseOrder
    {
        if ($po->status !== PurchaseOrderStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['أمر الشراء يجب أن يكون مسودة قبل إرساله للاعتماد.'],
            ]);
        }

        DB::transaction(function () use ($po, $userId) {
            $this->approvalService->submit($po, (float) $po->total_cost, $userId);
            $po->update(['status' => PurchaseOrderStatus::PendingApproval]);
        });

        return $po->fresh();
    }

    /**
     * Approver acts on the PO's pending approval request.
     */
    public function act(PurchaseOrder $po, User $approver, ApprovalActionType $action, ?string $comment = null): PurchaseOrder
    {
        $approvalRequest = $this->latestPendingApproval($po);

        if (! $approvalRequest) {
            throw ValidationException::withMessages([
                'approval' => ['لا يوجد طلب اعتماد معلّق لأمر الشراء هذا.'],
            ]);
        }

        DB::transaction(function () use ($po, $approver, $action, $comment, $approvalRequest) {
            $updated = $this->approvalService->act($approvalRequest, $approver, $action, $comment);

            if ($updated->status === ApprovalRequestStatus::Approved) {
                $po->update([
                    'status' => PurchaseOrderStatus::Approved,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                ]);

                // Cascade: mark linked requisitions as converted
                $reqIds = $po->items()->whereNotNull('requisition_id')->pluck('requisition_id')->unique();
                foreach ($reqIds as $reqId) {
                    $req = PurchaseRequisition::find($reqId);
                    if ($req && $req->status === RequisitionStatus::Approved) {
                        $this->requisitionService->markConverted($req, $po->id);
                    }
                }

                PurchaseOrderApproved::dispatch($po->fresh());
            } elseif ($updated->status === ApprovalRequestStatus::Rejected) {
                $po->update([
                    'status' => PurchaseOrderStatus::Draft,
                    'notes' => trim(($po->notes ?? '') . "\nRejected: " . ($comment ?? '')),
                ]);
            }
        });

        return $po->fresh();
    }

    /**
     * Move PO through later workflow stages (Ordered → Shipped → InTransit → InCustoms → Received).
     * Final stages (QualityCheck → Accepted/Rejected) are driven by GoodsReceiptNoteService.
     */
    public function transition(PurchaseOrder $po, string $newStatus): PurchaseOrder
    {
        $current = $po->status;
        $next = PurchaseOrderStatus::from($newStatus);

        if (! in_array($next, $current->allowedTransitions())) {
            throw ValidationException::withMessages([
                'status' => ["لا يمكن الانتقال من {$current->label()} إلى {$next->label()}."],
            ]);
        }

        // Manual stages only (approval, receive, qc are handled by their own flows)
        $manualStages = [
            PurchaseOrderStatus::Ordered,
            PurchaseOrderStatus::Shipped,
            PurchaseOrderStatus::InTransit,
            PurchaseOrderStatus::InCustoms,
            PurchaseOrderStatus::Closed,
        ];

        if (! in_array($next, $manualStages)) {
            throw ValidationException::withMessages([
                'status' => ['هذه الحالة تُدار من خلال عملية أخرى (اعتماد / استلام / فحص جودة).'],
            ]);
        }

        $po->update(['status' => $next]);

        return $po->fresh();
    }

    public function cancel(PurchaseOrder $po, ?string $reason = null): PurchaseOrder
    {
        if (! $po->status->isCancellable()) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إلغاء أمر الشراء في حالة ' . $po->status->label()],
            ]);
        }

        DB::transaction(function () use ($po, $reason) {
            if ($pending = $this->latestPendingApproval($po)) {
                $this->approvalService->cancel($pending, $reason);
            }

            $po->update([
                'status' => PurchaseOrderStatus::Cancelled,
                'notes' => $reason ? trim(($po->notes ?? '') . "\nCancelled: {$reason}") : $po->notes,
            ]);
        });

        return $po->fresh();
    }

    protected function latestPendingApproval(PurchaseOrder $po): ?ApprovalRequest
    {
        return ApprovalRequest::where('approvable_type', PurchaseOrder::class)
            ->where('approvable_id', $po->id)
            ->where('status', ApprovalRequestStatus::Pending)
            ->latest('id')
            ->first();
    }
}
