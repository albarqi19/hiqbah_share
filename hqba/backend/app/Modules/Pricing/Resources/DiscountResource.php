<?php

namespace App\Modules\Pricing\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiscountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'code' => $this->code,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'type_label_en' => $this->type->labelEn(),
            'calculation' => $this->calculation->value,
            'calculation_label' => $this->calculation->label(),
            'calculation_label_en' => $this->calculation->labelEn(),
            'value' => (float) $this->value,
            'min_order_amount' => $this->min_order_amount ? (float) $this->min_order_amount : null,
            'min_quantity' => $this->min_quantity,
            'max_uses' => $this->max_uses,
            'times_used' => $this->times_used,
            'remaining_uses' => $this->max_uses ? $this->max_uses - $this->times_used : null,
            'customer_id' => $this->customer_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'name_ar' => $this->customer->name_ar,
            ]),
            'price_list_id' => $this->price_list_id,
            'is_active' => $this->is_active,
            'valid_from' => $this->valid_from?->toISOString(),
            'valid_until' => $this->valid_until?->toISOString(),
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
                'name_ar' => $this->createdBy->name_ar,
            ]),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
