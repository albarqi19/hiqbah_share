<?php

namespace App\Modules\Orders\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'item_type' => $this->item_type,
            'product_name' => $this->product_name,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'total_price' => (float) $this->total_price,
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id, 'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name, 'name_ar' => $this->crop->name_ar,
            ]),
        ];
    }
}
