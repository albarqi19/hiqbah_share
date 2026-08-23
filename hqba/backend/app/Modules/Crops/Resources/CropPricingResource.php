<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropPricingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'landed_cost_per_kg' => $this->landed_cost_per_kg,
            'green_cost_per_kg' => $this->green_cost_per_kg,
            'roasting_loss_percent' => $this->roasting_loss_percent,
            'roasting_cost_per_kg' => $this->roasting_cost_per_kg,
            'packaging_cost_per_unit' => $this->packaging_cost_per_unit,
            'operation_cost_per_kg' => $this->operation_cost_per_kg,
            'shipping_cost_per_kg' => $this->shipping_cost_per_kg,
            'total_cost_per_kg_roasted' => $this->total_cost_per_kg_roasted,
            'target_margin_percent' => $this->target_margin_percent,
            'retail_price_250g' => $this->retail_price_250g,
            'retail_price_500g' => $this->retail_price_500g,
            'retail_price_1kg' => $this->retail_price_1kg,
            'wholesale_price_kg' => $this->wholesale_price_kg,
            'status' => $this->status,
            'set_by' => $this->set_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'crop' => new CropResource($this->whenLoaded('crop')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
