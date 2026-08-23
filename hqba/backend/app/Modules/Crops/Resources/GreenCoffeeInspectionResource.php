<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GreenCoffeeInspectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'green_coffee_lot_id' => $this->green_coffee_lot_id,
            'inspector_id' => $this->inspector_id,
            'moisture_percent' => $this->moisture_percent,
            'water_activity' => $this->water_activity,
            'density' => $this->density,
            'screen_size' => $this->screen_size,
            'defect_count' => $this->defect_count,
            'defect_notes' => $this->defect_notes,
            'visual_notes' => $this->visual_notes,
            'decision' => $this->decision,
            'rejection_reason' => $this->rejection_reason,
            'condition_notes' => $this->condition_notes,
            'photos' => $this->photos,
            'inspected_at' => $this->inspected_at,
            'green_coffee_lot' => new GreenCoffeeLotResource($this->whenLoaded('greenCoffeeLot')),
            'inspector' => $this->whenLoaded('inspector'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
