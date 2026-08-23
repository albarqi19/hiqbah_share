<?php

namespace App\Modules\Quality\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WasteRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'source_type' => class_basename($this->source_type),
            'source_id' => $this->source_id,
            'waste_type' => $this->waste_type,
            'weight_grams' => $this->weight_grams,
            'reason' => $this->reason,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
                'name_ar' => $this->creator->name_ar,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
