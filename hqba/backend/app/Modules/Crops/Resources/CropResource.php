<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'serial_number' => $this->serial_number,
            'purchase_order_id' => $this->purchase_order_id,
            'supplier_id' => $this->supplier_id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'origin_country' => $this->origin_country,
            'region' => $this->region,
            'farm' => $this->farm,
            'process' => $this->process,
            'variety' => $this->variety,
            'altitude' => $this->altitude,
            'lot_number' => $this->lot_number,
            'status' => $this->status,
            'total_green_weight' => $this->total_green_weight,
            'remaining_green_weight' => $this->remaining_green_weight,
            'usage_type' => $this->usage_type,
            'flavor_notes' => $this->flavor_notes,
            'description' => $this->description,
            'description_ar' => $this->description_ar,
            'brew_recommendations' => $this->brew_recommendations,
            'closed_at' => $this->closed_at,
            'supplier' => $this->whenLoaded('supplier'),
            'purchase_order' => $this->whenLoaded('purchaseOrder'),
            'pricing' => new CropPricingResource($this->whenLoaded('pricing')),
            'marketing' => new CropMarketingResource($this->whenLoaded('marketing')),
            'green_coffee_lots_count' => $this->whenCounted('greenCoffeeLots'),
            'trial_roasts_count' => $this->whenCounted('trialRoasts'),
            'cupping_sessions_count' => $this->whenCounted('cuppingSessions'),
            'recipes_count' => $this->whenCounted('recipes'),
            'waste_records_count' => $this->whenCounted('wasteRecords'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
