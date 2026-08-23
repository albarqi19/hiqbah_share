<?php

namespace App\Modules\Procurement\Resources;

use App\Core\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoodsReceiptNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grn_number' => $this->grn_number,
            'purchase_order_id' => $this->purchase_order_id,
            'received_by' => $this->received_by,
            'received_at' => $this->received_at,
            'bags_received' => $this->bags_received,
            'total_weight_received' => $this->total_weight_received,
            'expected_weight' => $this->expected_weight,
            'variance_weight' => $this->variance_weight,
            'variance_percent' => $this->variance_percent,
            'delivery_note_number' => $this->delivery_note_number,
            'carrier' => $this->carrier,
            'shipping_documents' => $this->shipping_documents,
            'photos' => $this->photos,
            'condition' => $this->condition instanceof \BackedEnum ? $this->condition->value : $this->condition,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'qc_started_at' => $this->qc_started_at,
            'qc_completed_at' => $this->qc_completed_at,
            'qc_completed_by' => $this->qc_completed_by,
            'qc_decision' => $this->qc_decision,
            'qc_moisture_percent' => $this->qc_moisture_percent,
            'qc_cupping_score' => $this->qc_cupping_score,
            'qc_notes' => $this->qc_notes,
            'notes' => $this->notes,

            'receiver' => new UserResource($this->whenLoaded('receiver')),
            'qc_completer' => new UserResource($this->whenLoaded('qcCompleter')),
            'items' => GoodsReceiptNoteItemResource::collection($this->whenLoaded('items')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
