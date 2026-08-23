<?php

namespace App\Modules\Sales\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'total' => (float) $this->order->total,
            ]),
            'sales_rep_id' => $this->sales_rep_id,
            'sales_rep' => $this->whenLoaded('salesRep', fn () => [
                'id' => $this->salesRep->id,
                'name' => $this->salesRep->name,
                'name_ar' => $this->salesRep->name_ar,
            ]),
            'commission_rule_id' => $this->commission_rule_id,
            'order_total' => (float) $this->order_total,
            'commission_amount' => (float) $this->commission_amount,
            'calculation_method' => $this->calculation_method,
            'calculation_value' => (float) $this->calculation_value,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'approved_at' => $this->approved_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'payment_reference' => $this->payment_reference,
            'reversed_by_id' => $this->reversed_by_id,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
