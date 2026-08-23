<?php

namespace App\Modules\Pricing\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price_list_id' => $this->price_list_id,
            'crop_id' => $this->crop_id,
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id,
                'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name,
                'name_ar' => $this->crop->name_ar,
            ]),
            'item_type' => $this->item_type->value,
            'item_type_label' => $this->item_type->label(),
            'item_type_label_en' => $this->item_type->labelEn(),
            'unit_price' => (float) $this->unit_price,
            'min_quantity' => (float) $this->min_quantity,
            'effective_from' => $this->effective_from?->toISOString(),
            'effective_until' => $this->effective_until?->toISOString(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
