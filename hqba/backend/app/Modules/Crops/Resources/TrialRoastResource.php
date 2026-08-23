<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrialRoastResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'green_coffee_lot_id' => $this->green_coffee_lot_id,
            'roaster_id' => $this->roaster_id,
            'trial_number' => $this->trial_number,
            'sample_weight_grams' => $this->sample_weight_grams,
            'roasted_weight_grams' => $this->roasted_weight_grams,
            'roast_loss_grams' => $this->roast_loss_grams,
            'roast_loss_percent' => $this->roast_loss_percent,
            'charge_temp' => $this->charge_temp,
            'drying_time' => $this->drying_time,
            'maillard_time' => $this->maillard_time,
            'first_crack_time' => $this->first_crack_time,
            'first_crack_temp' => $this->first_crack_temp,
            'development_time' => $this->development_time,
            'development_percent' => $this->development_percent,
            'drop_temp' => $this->drop_temp,
            'total_roast_time' => $this->total_roast_time,
            'roast_curve_data' => $this->roast_curve_data,
            'roast_level' => $this->roast_level,
            'usage_type' => $this->usage_type,
            'notes' => $this->notes,
            'status' => $this->status,
            'roasted_at' => $this->roasted_at,
            'crop' => new CropResource($this->whenLoaded('crop')),
            'green_coffee_lot' => new GreenCoffeeLotResource($this->whenLoaded('greenCoffeeLot')),
            'roaster' => $this->whenLoaded('roaster'),
            'cupping_sessions' => CuppingSessionResource::collection($this->whenLoaded('cuppingSessions')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
