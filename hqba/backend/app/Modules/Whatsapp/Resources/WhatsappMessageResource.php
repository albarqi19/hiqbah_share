<?php

namespace App\Modules\Whatsapp\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WhatsappMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'instance_id' => $this->instance_id,
            'instance_name' => $this->whenLoaded('instance', fn () => $this->instance?->display_name),
            'to_number' => $this->to_number,
            'direction' => $this->direction,
            'message' => $this->message,
            'status' => $this->status,
            'event_type' => $this->event_type,
            'error' => $this->error,
            'sent_at' => $this->sent_at,
            'created_at' => $this->created_at,
        ];
    }
}
