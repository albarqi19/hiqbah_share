<?php

namespace App\Modules\Inventory\Services;

use App\Core\Services\NotificationService;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Enums\TransferStatus;
use App\Modules\Inventory\Models\TransferOrder;
use App\Modules\Inventory\Models\TransferOrderItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TransferService
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(TransferOrder::class)
            ->allowedFilters([AllowedFilter::exact('status'), AllowedFilter::exact('to_branch_id')])
            ->allowedSorts(['created_at', 'status'])
            ->allowedIncludes(['fromBranch', 'toBranch', 'items.crop', 'creator'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function create(array $data, array $items): TransferOrder
    {
        $data['transfer_number'] = TransferOrder::generateTransferNumber();
        $data['status'] = TransferStatus::Draft->value;

        $transfer = TransferOrder::create($data);

        foreach ($items as $item) {
            $item['transfer_order_id'] = $transfer->id;
            TransferOrderItem::create($item);
        }

        return $transfer->load(['fromBranch', 'toBranch', 'items.crop', 'creator']);
    }

    public function approve(TransferOrder $transfer, int $userId): TransferOrder
    {
        $transfer->update([
            'status' => TransferStatus::Approved,
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
        return $transfer->fresh();
    }

    public function ship(TransferOrder $transfer, int $userId): TransferOrder
    {
        $transfer->update(['status' => TransferStatus::Shipped, 'shipped_at' => now()]);

        // Deduct from source branch inventory
        foreach ($transfer->items as $item) {
            $this->inventoryService->recordMovement(
                $transfer->from_branch_id, $item->crop_id,
                ItemType::from($item->item_type), MovementType::TransferOut,
                (float) $item->quantity_sent, $userId,
                get_class($transfer), $transfer->id, null,
                "Transfer out: {$transfer->transfer_number}",
            );
        }

        app(NotificationService::class)->sendToAdmins(
            'transfer_shipped', "Transfer {$transfer->transfer_number} shipped",
            "تم شحن التحويل {$transfer->transfer_number}", null, null,
            '/transfers', get_class($transfer), $transfer->id,
        );

        return $transfer->fresh();
    }

    public function receive(TransferOrder $transfer, array $receivedQuantities, int $userId): TransferOrder
    {
        $transfer->update(['status' => TransferStatus::Received, 'received_at' => now()]);

        foreach ($transfer->items as $item) {
            $received = $receivedQuantities[$item->id] ?? $item->quantity_sent;
            $item->update([
                'quantity_received' => $received,
                'quantity_variance' => $received - $item->quantity_sent,
            ]);

            // Add to destination branch
            $this->inventoryService->recordMovement(
                $transfer->to_branch_id, $item->crop_id,
                ItemType::from($item->item_type), MovementType::TransferIn,
                (float) $received, $userId,
                get_class($transfer), $transfer->id, null,
                "Transfer in: {$transfer->transfer_number}",
            );
        }

        return $transfer->fresh()->load('items');
    }

    public function confirm(TransferOrder $transfer): TransferOrder
    {
        $transfer->update(['status' => TransferStatus::Confirmed]);
        return $transfer->fresh();
    }
}
