<?php

namespace App\Modules\Sales\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'type_label_en' => $this->type->labelEn(),
            'value' => (float) $this->value,
            'sales_rep_id' => $this->sales_rep_id,
            'sales_rep' => $this->whenLoaded('salesRep', fn () => [
                'id' => $this->salesRep->id,
                'name' => $this->salesRep->name,
                'name_ar' => $this->salesRep->name_ar,
            ]),
            'customer_tier' => $this->customer_tier,
            'min_order_total' => $this->min_order_total ? (float) $this->min_order_total : null,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
