<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Models\InventoryAudit;
use App\Modules\Inventory\Models\InventoryAuditItem;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Support\Collection;

class AuditService
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function list()
    {
        return InventoryAudit::with(['branch', 'opener'])
            ->orderByDesc('created_at')
            ->paginate(request('per_page', 25));
    }

    public function open(int $branchId, string $auditType, int $userId): InventoryAudit
    {
        $audit = InventoryAudit::create([
            'branch_id' => $branchId,
            'audit_type' => $auditType,
            'status' => 'open',
            'opened_by' => $userId,
            'opened_at' => now(),
        ]);

        // Populate with current inventory items
        $query = InventoryItem::where('branch_id', $branchId);
        if ($auditType !== 'full') {
            $typeMap = [
                'green' => ['green'],
                'roasted' => ['roasted'],
                'finished' => ['finished_250', 'finished_500', 'finished_1kg'],
                'bar' => ['bar'],
            ];
            $query->whereIn('item_type', $typeMap[$auditType] ?? []);
        }

        $items = $query->get();
        foreach ($items as $item) {
            InventoryAuditItem::create([
                'inventory_audit_id' => $audit->id,
                'inventory_item_id' => $item->id,
                'crop_id' => $item->crop_id,
                'item_type' => $item->item_type->value,
                'system_quantity' => $item->quantity,
            ]);
        }

        return $audit->load(['items.crop', 'branch']);
    }

    public function countItem(InventoryAuditItem $auditItem, float $actualQuantity, int $userId, ?string $notes = null): InventoryAuditItem
    {
        $variance = $actualQuantity - (float) $auditItem->system_quantity;
        $variancePercent = (float) $auditItem->system_quantity > 0
            ? ($variance / (float) $auditItem->system_quantity) * 100
            : 0;

        $auditItem->update([
            'actual_quantity' => $actualQuantity,
            'variance' => $variance,
            'variance_percent' => round($variancePercent, 2),
            'counted_by' => $userId,
            'counted_at' => now(),
            'notes' => $notes,
        ]);

        return $auditItem->fresh();
    }

    public function approve(InventoryAudit $audit, int $userId): InventoryAudit
    {
        // Apply reconciliation for all items with variance
        foreach ($audit->items()->whereNotNull('actual_quantity')->where('variance', '!=', 0)->get() as $auditItem) {
            $this->inventoryService->reconcile(
                $audit->branch_id,
                $auditItem->crop_id,
                ItemType::from($auditItem->item_type),
                (float) $auditItem->actual_quantity,
                $userId,
                "Audit reconciliation (audit #{$audit->id})",
            );
        }

        $audit->update(['status' => 'approved']);
        return $audit->fresh();
    }

    public function close(InventoryAudit $audit, int $userId): InventoryAudit
    {
        // Calculate totals
        $totalVariance = $audit->items()->sum('variance');

        $audit->update([
            'status' => 'closed',
            'closed_by' => $userId,
            'closed_at' => now(),
            'total_variance_value' => $totalVariance,
        ]);

        return $audit->fresh();
    }
}
