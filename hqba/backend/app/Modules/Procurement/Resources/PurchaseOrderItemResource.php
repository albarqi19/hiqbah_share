<?php

namespace App\Modules\Procurement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_id' => $this->purchase_order_id,
            'requisition_id' => $this->requisition_id,
            'origin_country' => $this->origin_country,
            'region' => $this->region,
            'farm' => $this->farm,
            'process' => $this->process,
            'variety' => $this->variety,
            'altitude' => $this->altitude,
            'quantity_kg' => $this->quantity_kg,
            'price_per_kg' => $this->price_per_kg,
            'subtotal' => $this->subtotal,
            'expected_cupping_score' => $this->expected_cupping_score,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
