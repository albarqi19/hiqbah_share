<?php

namespace App\Modules\Procurement\Resources;

use App\Core\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'po_number' => $this->po_number,
            'supplier_id' => $this->supplier_id,
            'origin_country' => $this->origin_country,
            'region' => $this->region,
            'farm' => $this->farm,
            'process' => $this->process,
            'variety' => $this->variety,
            'altitude' => $this->altitude,
            'quantity_kg' => $this->quantity_kg,
            'price_per_kg' => $this->price_per_kg,
            'shipping_cost' => $this->shipping_cost,
            'customs_cost' => $this->customs_cost,
            'total_cost' => $this->total_cost,
            'currency' => $this->currency,
            'expected_date' => $this->expected_date,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'created_by' => $this->created_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'notes' => $this->notes,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'items' => PurchaseOrderItemResource::collection($this->whenLoaded('items')),
            'goods_receipt_notes' => GoodsReceiptNoteResource::collection($this->whenLoaded('goodsReceiptNotes')),
            'crops_count' => $this->whenCounted('crops'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
