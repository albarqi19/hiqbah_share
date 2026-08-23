<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CuppingSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'trial_roast_id' => $this->trial_roast_id,
            'grader_id' => $this->grader_id,
            'scheduled_date' => $this->scheduled_date,
            'cups_count' => $this->cups_count,
            'dose_per_cup' => $this->dose_per_cup,
            'total_coffee_used' => $this->total_coffee_used,
            'fragrance' => $this->fragrance,
            'aroma' => $this->aroma,
            'flavor' => $this->flavor,
            'acidity' => $this->acidity,
            'body' => $this->body,
            'aftertaste' => $this->aftertaste,
            'balance' => $this->balance,
            'sweetness' => $this->sweetness,
            'overall_score' => $this->overall_score,
            'flavor_notes' => $this->flavor_notes,
            'description' => $this->description,
            'brew_recommendations' => $this->brew_recommendations,
            'decision' => $this->decision,
            'rejection_reason' => $this->rejection_reason,
            'notes' => $this->notes,
            'photos' => $this->photos,
            'status' => $this->status,
            'crop' => new CropResource($this->whenLoaded('crop')),
            'trial_roast' => new TrialRoastResource($this->whenLoaded('trialRoast')),
            'grader' => $this->whenLoaded('grader'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
