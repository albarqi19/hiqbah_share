<?php

namespace App\Modules\Production\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoastQualityCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'roast_batch_id' => $this->roast_batch_id,
            'inspector_id' => $this->inspector_id,
            'sample_weight_grams' => (float) $this->sample_weight_grams,
            'color_score' => $this->color_score,
            'aroma_score' => $this->aroma_score,
            'flavor_score' => $this->flavor_score,
            'acidity_score' => $this->acidity_score,
            'body_score' => $this->body_score,
            'balance_score' => $this->balance_score,
            'total_score' => $this->total_score ? (float) $this->total_score : null,
            'decision' => $this->decision?->value,
            'rejection_reason' => $this->rejection_reason,
            'corrective_action' => $this->corrective_action,
            'notes' => $this->notes,
            'inspector' => $this->whenLoaded('inspector', fn () => [
                'id' => $this->inspector->id,
                'name' => $this->inspector->name,
                'name_ar' => $this->inspector->name_ar,
            ]),
            'roast_batch' => new RoastBatchResource($this->whenLoaded('roastBatch')),
            'checked_at' => $this->checked_at?->toISOString(),
            'created_at' => $this->created_at,
        ];
    }
}
