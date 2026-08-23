<?php

namespace App\Modules\Inventory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transfer_number' => $this->transfer_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'from_branch' => $this->whenLoaded('fromBranch', fn () => [
                'id' => $this->fromBranch->id, 'name' => $this->fromBranch->name, 'name_ar' => $this->fromBranch->name_ar,
            ]),
            'to_branch' => $this->whenLoaded('toBranch', fn () => [
                'id' => $this->toBranch->id, 'name' => $this->toBranch->name, 'name_ar' => $this->toBranch->name_ar,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id, 'name' => $this->creator->name, 'name_ar' => $this->creator->name_ar,
            ]),
            'items' => $this->whenLoaded('items', fn () =>
                $this->items->map(fn ($i) => [
                    'id' => $i->id, 'crop_id' => $i->crop_id, 'item_type' => $i->item_type,
                    'quantity_sent' => $i->quantity_sent, 'quantity_received' => $i->quantity_received,
                    'quantity_variance' => $i->quantity_variance,
                    'crop' => $i->relationLoaded('crop') ? ['id' => $i->crop->id, 'serial_number' => $i->crop->serial_number, 'name' => $i->crop->name, 'name_ar' => $i->crop->name_ar] : null,
                ])
            ),
            'approved_at' => $this->approved_at?->toISOString(),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'received_at' => $this->received_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
