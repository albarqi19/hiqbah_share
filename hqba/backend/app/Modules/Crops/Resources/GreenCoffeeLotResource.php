<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GreenCoffeeLotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'purchase_order_id' => $this->purchase_order_id,
            'batch_id' => $this->batch_id,
            'bags_count' => $this->bags_count,
            'expected_weight' => $this->expected_weight,
            'actual_weight' => $this->actual_weight,
            'weight_variance' => $this->weight_variance,
            'arrival_date' => $this->arrival_date,
            'barcode' => $this->barcode,
            'qr_code' => $this->qr_code,
            'shipping_document' => $this->shipping_document,
            'received_by' => $this->received_by,
            'status' => $this->status,
            'notes' => $this->notes,
            'crop' => new CropResource($this->whenLoaded('crop')),
            'received_by_user' => $this->whenLoaded('receivedBy'),
            'inspections' => GreenCoffeeInspectionResource::collection($this->whenLoaded('inspections')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
