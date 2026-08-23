<?php

namespace App\Modules\Pricing\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceChangeLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'changes' => $this->changes,
            'change_reason' => $this->change_reason,
            'changed_by' => $this->whenLoaded('changedBy', fn () => [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
                'name_ar' => $this->changedBy->name_ar,
            ]),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
