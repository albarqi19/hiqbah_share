<?php

namespace App\Modules\Reporting\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryMovement;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Production\Models\PackagingLot;
use App\Modules\Quality\Models\WasteRecord;

class CropReportService
{
    public function getCropReport(int $cropId): array
    {
        $crop = Crop::with(['supplier', 'purchaseOrder', 'pricing'])->findOrFail($cropId);

        // Production
        $roastBatches = RoastBatch::where('crop_id', $cropId)->get();
        $totalRoastedKg = (float) $roastBatches->sum('roasted_weight_kg');
        $totalRoastLossKg = (float) $roastBatches->sum('roast_loss_kg');
        $avgRoastLoss = $roastBatches->count() > 0
            ? round($roastBatches->avg('roast_loss_percent'), 1)
            : 0;

        // Packaging
        $packagingLots = PackagingLot::where('crop_id', $cropId)->where('status', 'completed')->get();
        $totalBags = $packagingLots->sum('bags_count');

        // Waste
        $waste = WasteRecord::where('crop_id', $cropId)->get();
        $wasteByType = $waste->groupBy('waste_type')->map(fn ($g) => [
            'type' => $g->first()->waste_type,
            'grams' => (float) $g->sum('weight_grams'),
            'kg' => round($g->sum('weight_grams') / 1000, 3),
        ])->values();
        $totalWasteKg = round($waste->sum('weight_grams') / 1000, 3);

        // Sales
        $salesItems = OrderItem::where('crop_id', $cropId)
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['shipped', 'closed']))
            ->get();
        $totalSalesRevenue = (float) $salesItems->sum('total_price');
        $totalUnitsSold = $salesItems->sum('quantity');

        // Cost
        $totalCost = $crop->purchaseOrder ? (float) $crop->purchaseOrder->total_cost : 0;
        $profit = $totalSalesRevenue - $totalCost;

        // Inventory
        $inventoryItems = InventoryItem::where('crop_id', $cropId)->get();

        return [
            'crop' => [
                'id' => $crop->id,
                'serial_number' => $crop->serial_number,
                'name' => $crop->name,
                'name_ar' => $crop->name_ar,
                'origin_country' => $crop->origin_country,
                'status' => $crop->status->value,
            ],
            'green_coffee' => [
                'total_weight_kg' => (float) $crop->total_green_weight,
                'remaining_weight_kg' => (float) $crop->remaining_green_weight,
                'used_kg' => (float) $crop->total_green_weight - (float) $crop->remaining_green_weight,
            ],
            'production' => [
                'roast_batches' => $roastBatches->count(),
                'total_roasted_kg' => $totalRoastedKg,
                'total_roast_loss_kg' => $totalRoastLossKg,
                'avg_roast_loss_percent' => $avgRoastLoss,
            ],
            'packaging' => [
                'lots' => $packagingLots->count(),
                'total_bags' => $totalBags,
            ],
            'waste' => [
                'total_kg' => $totalWasteKg,
                'by_type' => $wasteByType,
            ],
            'sales' => [
                'units_sold' => $totalUnitsSold,
                'revenue' => $totalSalesRevenue,
            ],
            'financials' => [
                'total_cost' => $totalCost,
                'total_revenue' => $totalSalesRevenue,
                'profit' => $profit,
                'margin_percent' => $totalSalesRevenue > 0 ? round(($profit / $totalSalesRevenue) * 100, 1) : 0,
            ],
            'current_inventory' => $inventoryItems->map(fn ($i) => [
                'item_type' => $i->item_type->value,
                'quantity' => (float) $i->quantity,
                'unit' => $i->unit,
                'branch_id' => $i->branch_id,
            ]),
        ];
    }
}
