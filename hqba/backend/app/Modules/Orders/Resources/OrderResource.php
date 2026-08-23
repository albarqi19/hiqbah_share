<?php

namespace App\Modules\Orders\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'sales_rep_id' => $this->sales_rep_id,
            'price_list_id' => $this->price_list_id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'subtotal' => (float) $this->subtotal,
            'vat_percent' => (float) $this->vat_percent,
            'vat_amount' => (float) $this->vat_amount,
            'discount' => (float) $this->discount,
            'discount_id' => $this->discount_id,
            'discount_code' => $this->discount_code,
            'total' => (float) $this->total,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'payment_terms' => $this->payment_terms,
            'payment_due_date' => $this->payment_due_date?->toDateString(),
            'is_payment_overdue' => $this->isPaymentOverdue(),
            'paid_at' => $this->paid_at?->toISOString(),
            'shipping_address' => $this->shipping_address,
            'shipping_city' => $this->shipping_city,
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'delivery_notes' => $this->delivery_notes,
            'quote_number' => $this->quote_number,
            'quote_generated_at' => $this->quote_generated_at?->toISOString(),
            'notes' => $this->notes,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id, 'name' => $this->creator->name, 'name_ar' => $this->creator->name_ar,
            ]),
            'sales_rep' => $this->whenLoaded('salesRep', fn () => [
                'id' => $this->salesRep->id, 'name' => $this->salesRep->name, 'name_ar' => $this->salesRep->name_ar,
            ]),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'shipments' => ShipmentResource::collection($this->whenLoaded('shipments')),
            'allocations_count' => $this->whenCounted('allocations'),
            'shipments_count' => $this->whenCounted('shipments'),
            'status_history' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'from' => $h->from_status,
                'to' => $h->to_status,
                'changed_by' => $h->user?->name,
                'notes' => $h->notes,
                'created_at' => $h->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
