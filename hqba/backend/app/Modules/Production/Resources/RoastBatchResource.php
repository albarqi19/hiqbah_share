<?php

namespace App\Modules\Production\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoastBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'batch_number' => $this->batch_number,
            'crop_id' => $this->crop_id,
            'recipe_id' => $this->recipe_id,
            'roaster_id' => $this->roaster_id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'queue_position' => $this->queue_position,
            'is_priority' => $this->is_priority,
            'green_weight_kg' => (float) $this->green_weight_kg,
            'roasted_weight_kg' => $this->roasted_weight_kg ? (float) $this->roasted_weight_kg : null,
            'roast_loss_kg' => $this->roast_loss_kg ? (float) $this->roast_loss_kg : null,
            'roast_loss_percent' => $this->roast_loss_percent ? (float) $this->roast_loss_percent : null,
            'target' => [
                'charge_temp' => $this->target_charge_temp,
                'first_crack_time' => $this->target_first_crack_time,
                'first_crack_temp' => $this->target_first_crack_temp,
                'development_time' => $this->target_development_time,
                'drop_temp' => $this->target_drop_temp,
                'total_time' => $this->target_total_time,
                'roast_level' => $this->target_roast_level?->value,
            ],
            'actual' => [
                'charge_temp' => $this->actual_charge_temp,
                'first_crack_time' => $this->actual_first_crack_time,
                'first_crack_temp' => $this->actual_first_crack_temp,
                'development_time' => $this->actual_development_time,
                'development_percent' => $this->actual_development_percent,
                'drop_temp' => $this->actual_drop_temp,
                'total_time' => $this->actual_total_time,
                'roast_level' => $this->actual_roast_level?->value,
            ],
            'roast_curve_data' => $this->roast_curve_data,
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id,
                'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name,
                'name_ar' => $this->crop->name_ar,
                'origin_country' => $this->crop->origin_country,
            ]),
            'recipe' => $this->whenLoaded('recipe', fn () => [
                'id' => $this->recipe->id,
                'recipe_code' => $this->recipe->recipe_code,
                'recipe_type' => $this->recipe->recipe_type,
            ]),
            'roaster' => $this->whenLoaded('roaster', fn () => [
                'id' => $this->roaster->id,
                'name' => $this->roaster->name,
                'name_ar' => $this->roaster->name_ar,
            ]),
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
