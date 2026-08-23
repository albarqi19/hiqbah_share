<?php

namespace App\Modules\Pricing\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListResource extends JsonResource
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
            'currency' => $this->currency,
            'is_default' => $this->is_default,
            'is_active' => $this->is_active,
            'description' => $this->description,
            'description_ar' => $this->description_ar,
            'rounding_rule' => $this->rounding_rule->value,
            'rounding_rule_label' => $this->rounding_rule->label(),
            'rounding_rule_label_en' => $this->rounding_rule->labelEn(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'items_count' => $this->whenCounted('items'),
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
                'name_ar' => $this->createdBy->name_ar,
            ]),
            'approved_by' => $this->approved_by,
            'approver' => $this->whenLoaded('approvedBy', fn () => [
                'id' => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
                'name_ar' => $this->approvedBy->name_ar,
            ]),
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
