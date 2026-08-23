<?php

namespace App\Modules\Orders\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shipment_number' => $this->shipment_number,
            'order_id' => $this->order_id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'shipping_address' => $this->shipping_address,
            'shipping_city' => $this->shipping_city,
            'carrier' => $this->carrier,
            'tracking_number' => $this->tracking_number,
            'notes' => $this->notes,
            'creator' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
                'name_ar' => $this->createdBy->name_ar,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($si) => [
                'id' => $si->id,
                'order_item_id' => $si->order_item_id,
                'quantity_shipped' => $si->quantity_shipped,
                'order_item' => $si->relationLoaded('orderItem') ? [
                    'id' => $si->orderItem->id,
                    'product_name' => $si->orderItem->product_name,
                    'item_type' => $si->orderItem->item_type,
                    'quantity' => $si->orderItem->quantity,
                ] : null,
            ])),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'delivery_confirmation' => $this->delivery_confirmation,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
