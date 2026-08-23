<?php

namespace App\Modules\Procurement\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptNoteItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'goods_receipt_note_id' => $this->goods_receipt_note_id,
            'purchase_order_item_id' => $this->purchase_order_item_id,
            'bags_received' => $this->bags_received,
            'weight_received' => $this->weight_received,
            'expected_weight' => $this->expected_weight,
            'variance' => $this->variance,
            'condition' => $this->condition instanceof \BackedEnum ? $this->condition->value : $this->condition,
            'notes' => $this->notes,
            'purchase_order_item' => new PurchaseOrderItemResource($this->whenLoaded('purchaseOrderItem')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
