<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryMovement;

class CupConsumptionService
{
    public function getConsumption(int $branchId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        // Total received at branch (transfer_in)
        $receivedQuery = InventoryMovement::where('branch_id', $branchId)
            ->where('movement_type', 'transfer_in');
        if ($dateFrom) $receivedQuery->where('created_at', '>=', $dateFrom);
        if ($dateTo) $receivedQuery->where('created_at', '<=', $dateTo);
        $totalReceived = $receivedQuery->sum('quantity');

        // Current bar stock
        $barStock = InventoryItem::where('branch_id', $branchId)
            ->where('item_type', ItemType::Bar)
            ->sum('quantity');

        // Finished stock at branch
        $finishedStock = InventoryItem::where('branch_id', $branchId)
            ->whereIn('item_type', ['finished_250', 'finished_500', 'finished_1kg'])
            ->sum('quantity');

        // Calibration waste
        $calibrationWaste = InventoryMovement::where('branch_id', $branchId)
            ->where('movement_type', 'calibration_waste')
            ->when($dateFrom, fn ($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('created_at', '<=', $dateTo))
            ->sum('quantity');

        // Consumption = received - remaining - waste
        $consumed = max(0, $totalReceived - $barStock - $calibrationWaste);

        // Estimate cups: average dose 18g
        $estimatedCups = $consumed > 0 ? round($consumed / 18) : 0;

        return [
            'branch_id' => $branchId,
            'total_received_g' => (float) $totalReceived,
            'current_bar_stock_g' => (float) $barStock,
            'finished_bags_in_branch' => (float) $finishedStock,
            'calibration_waste_g' => (float) $calibrationWaste,
            'estimated_consumption_g' => $consumed,
            'estimated_cups' => $estimatedCups,
            'average_dose_g' => 18,
        ];
    }
}
