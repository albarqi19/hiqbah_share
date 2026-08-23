<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CropPricing;

class PricingService
{
    public function __construct(protected CropService $cropService) {}

    public function getForCrop(Crop $crop): ?CropPricing
    {
        return $crop->pricing;
    }

    public function calculate(Crop $crop, array $data): CropPricing
    {
        $po = $crop->purchaseOrder;

        // Calculate landed cost (distributed if multi-crop PO)
        $totalPoCrops = $po->crops()->count();
        $landedCost = $totalPoCrops > 1
            ? ($po->total_cost / $po->quantity_kg)
            : ($po->total_cost / $po->quantity_kg);

        $data['crop_id'] = $crop->id;
        $data['landed_cost_per_kg'] = $landedCost;
        $data['green_cost_per_kg'] = $data['green_cost_per_kg'] ?? $landedCost;

        // Get roasting loss from trial roasts average
        $avgLoss = $crop->trialRoasts()
            ->whereNotNull('roast_loss_percent')
            ->avg('roast_loss_percent');
        $data['roasting_loss_percent'] = $data['roasting_loss_percent'] ?? ($avgLoss ?? 15);

        // Default costs
        $data['roasting_cost_per_kg'] = $data['roasting_cost_per_kg'] ?? 0;
        $data['packaging_cost_per_unit'] = $data['packaging_cost_per_unit'] ?? 0;
        $data['operation_cost_per_kg'] = $data['operation_cost_per_kg'] ?? 0;
        $data['shipping_cost_per_kg'] = $data['shipping_cost_per_kg'] ?? 0;

        // Calculate total cost per kg roasted
        $greenCostAdjusted = $data['green_cost_per_kg'] / (1 - ($data['roasting_loss_percent'] / 100));
        $data['total_cost_per_kg_roasted'] = $greenCostAdjusted
            + $data['roasting_cost_per_kg']
            + $data['operation_cost_per_kg']
            + $data['shipping_cost_per_kg'];

        // Calculate suggested retail prices based on margin
        $margin = $data['target_margin_percent'] ?? 30;
        $costPerKg = $data['total_cost_per_kg_roasted'];
        $retailPerKg = $costPerKg * (1 + ($margin / 100));

        $data['retail_price_250g'] = $data['retail_price_250g'] ?? round($retailPerKg * 0.25, 2);
        $data['retail_price_500g'] = $data['retail_price_500g'] ?? round($retailPerKg * 0.5, 2);
        $data['retail_price_1kg'] = $data['retail_price_1kg'] ?? round($retailPerKg, 2);
        $data['wholesale_price_kg'] = $data['wholesale_price_kg'] ?? round($costPerKg * 1.15, 2);

        $pricing = CropPricing::updateOrCreate(
            ['crop_id' => $crop->id],
            $data,
        );

        // Advance crop status
        if ($crop->status->value === 'approved') {
            $this->cropService->advanceStatus($crop, 'pricing');
        }

        return $pricing;
    }

    public function update(CropPricing $pricing, array $data): CropPricing
    {
        $pricing->update($data);

        return $pricing->fresh();
    }

    public function approve(CropPricing $pricing, int $approverId): CropPricing
    {
        $pricing->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);

        $crop = $pricing->crop;
        if ($crop->status->value === 'pricing') {
            $this->cropService->advanceStatus($crop, 'marketing');
        }

        return $pricing->fresh();
    }
}
