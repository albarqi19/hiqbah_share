<?php

namespace App\Modules\Procurement\Services;

use App\Modules\Procurement\Enums\GrnStatus;
use App\Modules\Procurement\Enums\PurchaseOrderStatus;
use App\Modules\Procurement\Events\GoodsAccepted;
use App\Modules\Procurement\Events\GoodsReceived;
use App\Modules\Procurement\Models\GoodsReceiptNote;
use App\Modules\Procurement\Models\GoodsReceiptNoteItem;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Models\PurchaseOrderItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class GoodsReceiptNoteService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(GoodsReceiptNote::class)
            ->allowedFilters([
                AllowedFilter::exact('purchase_order_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('received_by'),
                'grn_number',
            ])
            ->allowedSorts(['grn_number', 'received_at', 'created_at'])
            ->allowedIncludes(['purchaseOrder', 'receiver', 'qcCompleter', 'items.purchaseOrderItem'])
            ->defaultSort('-received_at')
            ->paginate(request('per_page', 15));
    }

    /**
     * Receive goods against a PO.
     *
     * @param  PurchaseOrder  $po
     * @param  array  $data  bags_received, total_weight_received, delivery_note_number, carrier, condition, notes, …
     * @param  array  $items  list of receipt lines: purchase_order_item_id, weight_received, bags_received, condition, notes
     * @param  int  $userId
     */
    public function receive(PurchaseOrder $po, array $data, array $items, int $userId): GoodsReceiptNote
    {
        if (! in_array($po->status, [
            PurchaseOrderStatus::Ordered,
            PurchaseOrderStatus::Shipped,
            PurchaseOrderStatus::InTransit,
            PurchaseOrderStatus::InCustoms,
        ])) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن استلام بضاعة لأمر شراء في حالة ' . $po->status->label()],
            ]);
        }

        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => ['يجب إدخال بند استلام واحد على الأقل.'],
            ]);
        }

        return DB::transaction(function () use ($po, $data, $items, $userId) {
            // Validate that all referenced PO items belong to this PO
            $poItemIds = $po->items()->pluck('id')->all();
            foreach ($items as $line) {
                if (! in_array($line['purchase_order_item_id'], $poItemIds)) {
                    throw ValidationException::withMessages([
                        'items' => ['أحد البنود لا ينتمي لأمر الشراء.'],
                    ]);
                }
            }

            $expectedTotal = (float) $po->items()->sum('quantity_kg');

            $grn = GoodsReceiptNote::create([
                'grn_number' => GoodsReceiptNote::generateGrnNumber(),
                'purchase_order_id' => $po->id,
                'received_by' => $userId,
                'received_at' => $data['received_at'] ?? now(),
                'bags_received' => $data['bags_received'] ?? 0,
                'total_weight_received' => $data['total_weight_received'] ?? 0,
                'expected_weight' => $expectedTotal,
                'delivery_note_number' => $data['delivery_note_number'] ?? null,
                'carrier' => $data['carrier'] ?? null,
                'shipping_documents' => $data['shipping_documents'] ?? null,
                'photos' => $data['photos'] ?? null,
                'condition' => $data['condition'] ?? 'good',
                'status' => GrnStatus::Received,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($items as $line) {
                $poItem = PurchaseOrderItem::findOrFail($line['purchase_order_item_id']);
                $variance = (float) ($line['weight_received'] ?? 0) - (float) $poItem->quantity_kg;

                GoodsReceiptNoteItem::create([
                    'goods_receipt_note_id' => $grn->id,
                    'purchase_order_item_id' => $poItem->id,
                    'bags_received' => $line['bags_received'] ?? 0,
                    'weight_received' => $line['weight_received'] ?? 0,
                    'expected_weight' => $poItem->quantity_kg,
                    'variance' => $variance,
                    'condition' => $line['condition'] ?? 'good',
                    'notes' => $line['notes'] ?? null,
                ]);
            }

            $grn->calculateVariance();
            $grn->save();

            // Move PO to "received"
            $po->update(['status' => PurchaseOrderStatus::Received]);

            GoodsReceived::dispatch($grn);

            return $grn->fresh()->load('items.purchaseOrderItem');
        });
    }

    /**
     * QC officer starts the quality inspection.
     */
    public function startQualityCheck(GoodsReceiptNote $grn): GoodsReceiptNote
    {
        if ($grn->status !== GrnStatus::Received) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن بدء فحص الجودة في حالة ' . $grn->status->label()],
            ]);
        }

        $grn->update([
            'status' => GrnStatus::PendingQc,
            'qc_started_at' => now(),
        ]);

        // Reflect on PO too
        $grn->purchaseOrder()->update(['status' => PurchaseOrderStatus::QualityCheck]);

        return $grn->fresh();
    }

    /**
     * QC officer records the decision: accepted | conditionally_accepted | rejected.
     */
    public function completeQualityCheck(
        GoodsReceiptNote $grn,
        string $decision,
        int $userId,
        array $qcData = [],
    ): GoodsReceiptNote {
        if ($grn->status !== GrnStatus::PendingQc) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إنهاء فحص الجودة من حالة ' . $grn->status->label()],
            ]);
        }

        $statusMap = [
            'accepted' => GrnStatus::Accepted,
            'conditionally_accepted' => GrnStatus::ConditionallyAccepted,
            'rejected' => GrnStatus::Rejected,
        ];

        if (! isset($statusMap[$decision])) {
            throw ValidationException::withMessages([
                'decision' => ['قرار غير صالح. القيم المسموحة: accepted | conditionally_accepted | rejected.'],
            ]);
        }

        return DB::transaction(function () use ($grn, $decision, $userId, $qcData, $statusMap) {
            $grn->update([
                'status' => $statusMap[$decision],
                'qc_decision' => $decision,
                'qc_completed_at' => now(),
                'qc_completed_by' => $userId,
                'qc_moisture_percent' => $qcData['moisture_percent'] ?? null,
                'qc_cupping_score' => $qcData['cupping_score'] ?? null,
                'qc_notes' => $qcData['notes'] ?? null,
            ]);

            $poStatusMap = [
                'accepted' => PurchaseOrderStatus::Accepted,
                'conditionally_accepted' => PurchaseOrderStatus::ConditionallyAccepted,
                'rejected' => PurchaseOrderStatus::Rejected,
            ];
            $grn->purchaseOrder()->update(['status' => $poStatusMap[$decision]]);

            if (in_array($decision, ['accepted', 'conditionally_accepted'])) {
                GoodsAccepted::dispatch($grn->fresh());
            }

            return $grn->fresh();
        });
    }
}
