<?php

namespace App\Modules\Whatsapp\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WhatsappInstanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'phone_number' => $this->phone_number,
            'status' => $this->status,
            'is_default' => $this->is_default,
            'qr_code' => $this->qr_code,
            'connected_at' => $this->connected_at,
            'last_qr_at' => $this->last_qr_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
