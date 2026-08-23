<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Events\InventoryLow;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryMovement;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryService
{
    /**
     * Central method: ALL inventory changes go through here.
     * Atomic, locked, validated, traced.
     */
    public function recordMovement(
        int $branchId,
        int $cropId,
        ItemType $itemType,
        MovementType $movementType,
        float $quantity,
        int $staffId,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?float $costPerUnit = null,
        ?string $notes = null,
    ): InventoryMovement {
        return DB::transaction(function () use (
            $branchId, $cropId, $itemType, $movementType,
            $quantity, $staffId, $referenceType, $referenceId, $costPerUnit, $notes,
        ) {
            // Idempotency: skip if this exact movement already exists
            if ($referenceType && $referenceId) {
                $exists = InventoryMovement::where('reference_type', $referenceType)
                    ->where('reference_id', $referenceId)
                    ->where('movement_type', $movementType)
                    ->exists();

                if ($exists) {
                    return InventoryMovement::where('reference_type', $referenceType)
                        ->where('reference_id', $referenceId)
                        ->where('movement_type', $movementType)
                        ->first();
                }
            }

            // Find or create inventory item with pessimistic lock
            $item = InventoryItem::lockForUpdate()->firstOrCreate(
                [
                    'branch_id' => $branchId,
                    'crop_id' => $cropId,
                    'item_type' => $itemType,
                ],
                [
                    'unit' => $itemType->defaultUnit(),
                    'quantity' => 0,
                ],
            );

            // If item was just created, lock it properly
            if ($item->wasRecentlyCreated) {
                $item = InventoryItem::lockForUpdate()->find($item->id);
            }

            // Determine direction
            $direction = $movementType->isIncoming() ? 'in' : 'out';

            // For reconciliation, direction is determined by caller context
            if ($movementType === MovementType::Reconciliation) {
                // Direction passed via notes convention or determined by context
                // The caller sets the direction explicitly
            }

            // Calculate new quantity
            $newQuantity = $direction === 'in'
                ? $item->quantity + $quantity
                : $item->quantity - $quantity;

            // Prevent negative stock (except reconciliation which can go to any positive value)
            if ($newQuantity < 0) {
                throw new InsufficientStockException(
                    $branchId, $cropId, $itemType,
                    (float) $item->quantity, $quantity,
                );
            }

            // Update inventory item
            $item->update([
                'quantity' => $newQuantity,
                'last_movement_at' => now(),
            ]);

            // Calculate total cost
            $totalCost = $costPerUnit ? $costPerUnit * $quantity : null;

            // Create movement record
            $movement = InventoryMovement::create([
                'inventory_item_id' => $item->id,
                'branch_id' => $branchId,
                'crop_id' => $cropId,
                'movement_type' => $movementType,
                'direction' => $direction,
                'quantity' => $quantity,
                'balance_after' => $newQuantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'cost_per_unit' => $costPerUnit,
                'total_cost' => $totalCost,
                'staff_id' => $staffId,
                'notes' => $notes,
                'created_at' => now(),
            ]);

            // Check threshold alert
            if ($item->min_threshold !== null && $newQuantity <= $item->min_threshold) {
                InventoryLow::dispatch($item->fresh());
            }

            return $movement;
        });
    }

    /**
     * Get inventory stock with filtering.
     */
    public function getStock(): LengthAwarePaginator
    {
        return QueryBuilder::for(InventoryItem::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('item_type'),
                AllowedFilter::exact('crop_id'),
                AllowedFilter::scope('below_threshold', 'belowThreshold'),
            ])
            ->allowedSorts(['quantity', 'last_movement_at', 'created_at', 'item_type'])
            ->allowedIncludes(['branch', 'crop', 'latestMovement'])
            ->defaultSort('-last_movement_at')
            ->paginate(request('per_page', 25));
    }

    /**
     * Get movement history with filtering.
     */
    public function getMovements(): LengthAwarePaginator
    {
        return QueryBuilder::for(InventoryMovement::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('movement_type'),
                AllowedFilter::exact('direction'),
                AllowedFilter::scope('date_from', 'inDateRange'),
            ])
            ->allowedSorts(['created_at', 'quantity'])
            ->allowedIncludes(['inventoryItem', 'branch', 'crop', 'staff'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    /**
     * Get items below their minimum threshold.
     */
    public function getAlerts(?int $branchId = null): Collection
    {
        $query = InventoryItem::belowThreshold()
            ->with(['branch', 'crop']);

        if ($branchId) {
            $query->byBranch($branchId);
        }

        return $query->orderByRaw('quantity / NULLIF(min_threshold, 0) ASC')
            ->get();
    }

    /**
     * Manual stock adjustment.
     */
    public function adjust(
        int $branchId,
        int $cropId,
        ItemType $itemType,
        float $newQuantity,
        int $staffId,
        string $reason,
    ): InventoryMovement {
        $item = InventoryItem::where('branch_id', $branchId)
            ->where('crop_id', $cropId)
            ->where('item_type', $itemType)
            ->first();

        $currentQuantity = $item ? (float) $item->quantity : 0;
        $delta = abs($newQuantity - $currentQuantity);

        if ($delta == 0) {
            // No change needed, return latest movement
            return $item->latestMovement ?? throw new \RuntimeException('No change needed');
        }

        $movementType = $newQuantity > $currentQuantity
            ? MovementType::AdjustmentIn
            : MovementType::AdjustmentOut;

        return $this->recordMovement(
            $branchId, $cropId, $itemType, $movementType,
            $delta, $staffId, null, null, null,
            "Manual adjustment: {$reason}",
        );
    }

    /**
     * Stock reconciliation (physical count vs system).
     */
    public function reconcile(
        int $branchId,
        int $cropId,
        ItemType $itemType,
        float $actualQuantity,
        int $staffId,
        ?string $notes = null,
    ): InventoryMovement {
        $item = InventoryItem::where('branch_id', $branchId)
            ->where('crop_id', $cropId)
            ->where('item_type', $itemType)
            ->first();

        $systemQuantity = $item ? (float) $item->quantity : 0;
        $variance = $actualQuantity - $systemQuantity;

        if ($variance == 0) {
            throw new \RuntimeException('No variance found');
        }

        // For reconciliation, we use adjustment types but with reconciliation notes
        $movementType = $variance > 0
            ? MovementType::AdjustmentIn
            : MovementType::AdjustmentOut;

        $reconcileNotes = "Stock reconciliation: system={$systemQuantity}, actual={$actualQuantity}, variance={$variance}";
        if ($notes) {
            $reconcileNotes .= " | {$notes}";
        }

        return $this->recordMovement(
            $branchId, $cropId, $itemType, $movementType,
            abs($variance), $staffId, null, null, null,
            $reconcileNotes,
        );
    }

    /**
     * Set minimum threshold for an inventory item.
     */
    public function setThreshold(InventoryItem $item, float $threshold): InventoryItem
    {
        $item->update(['min_threshold' => $threshold]);

        return $item->fresh();
    }

    /**
     * Check if sufficient stock is available.
     */
    public function checkAvailability(
        int $branchId,
        int $cropId,
        ItemType $itemType,
        float $requiredQuantity,
    ): bool {
        $item = InventoryItem::where('branch_id', $branchId)
            ->where('crop_id', $cropId)
            ->where('item_type', $itemType)
            ->first();

        return $item && (float) $item->quantity >= $requiredQuantity;
    }

    /**
     * Dashboard summary KPIs.
     */
    public function getSummary(?int $branchId = null): array
    {
        $query = InventoryItem::query()->with('branch');

        if ($branchId) {
            $query->byBranch($branchId);
        }

        $items = $query->get();

        $totalGreenKg = $items->where('item_type', ItemType::Green)->sum('quantity');
        $totalRoastedKg = $items->where('item_type', ItemType::Roasted)->sum('quantity');
        $totalFinishedBags = $items->filter(fn ($i) => $i->item_type->isFinished())->sum('quantity');
        $lowStockCount = $items->filter(fn ($i) => $i->isLow())->count();

        $movementsToday = InventoryMovement::whereDate('created_at', today());
        if ($branchId) {
            $movementsToday->byBranch($branchId);
        }

        // By branch
        $byBranch = $items->groupBy('branch_id')->map(function ($group) {
            $branch = $group->first()->branch;
            return [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'branch_name_ar' => $branch->name_ar,
                'items_count' => $group->count(),
                'low_count' => $group->filter(fn ($i) => $i->isLow())->count(),
            ];
        })->values();

        // By crop
        $byCrop = $items->groupBy('crop_id')->map(function ($group) {
            $crop = $group->first()->crop;
            return [
                'crop_id' => $crop->id,
                'serial_number' => $crop->serial_number,
                'name' => $crop->name,
                'name_ar' => $crop->name_ar,
                'green_kg' => (float) $group->where('item_type', ItemType::Green)->sum('quantity'),
                'roasted_kg' => (float) $group->where('item_type', ItemType::Roasted)->sum('quantity'),
                'finished_bags' => (float) $group->filter(fn ($i) => $i->item_type->isFinished())->sum('quantity'),
            ];
        })->values();

        return [
            'total_green_kg' => (float) $totalGreenKg,
            'total_roasted_kg' => (float) $totalRoastedKg,
            'total_finished_bags' => (float) $totalFinishedBags,
            'low_stock_count' => $lowStockCount,
            'movements_today' => $movementsToday->count(),
            'by_branch' => $byBranch,
            'by_crop' => $byCrop,
        ];
    }

    /**
     * Inventory valuation using cost_per_unit from latest movements.
     */
    public function getValuation(?int $branchId = null): array
    {
        $query = InventoryItem::query()
            ->with(['branch', 'crop', 'latestMovement'])
            ->where('quantity', '>', 0);

        if ($branchId) {
            $query->byBranch($branchId);
        }

        $items = $query->get();

        $totalValue = 0;
        $valuedItems = $items->map(function ($item) use (&$totalValue) {
            // Get last movement with cost info
            $lastCostMovement = InventoryMovement::where('inventory_item_id', $item->id)
                ->whereNotNull('cost_per_unit')
                ->where('direction', 'in')
                ->latest('created_at')
                ->first();

            $costPerUnit = $lastCostMovement?->cost_per_unit ?? 0;
            $value = (float) $item->quantity * (float) $costPerUnit;
            $totalValue += $value;

            return [
                'id' => $item->id,
                'branch' => $item->branch?->name,
                'crop_serial' => $item->crop?->serial_number,
                'item_type' => $item->item_type->value,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'cost_per_unit' => (float) $costPerUnit,
                'total_value' => $value,
            ];
        });

        return [
            'total_value' => $totalValue,
            'currency' => 'SAR',
            'items' => $valuedItems,
        ];
    }
}
