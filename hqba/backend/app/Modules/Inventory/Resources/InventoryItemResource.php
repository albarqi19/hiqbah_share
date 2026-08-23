<?php

namespace App\Modules\Inventory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'crop_id' => $this->crop_id,
            'item_type' => $this->item_type->value,
            'item_type_label' => $this->item_type->label(),
            'item_type_label_en' => $this->item_type->labelEn(),
            'sku' => $this->sku,
            'quantity' => (float) $this->quantity,
            'unit' => $this->unit,
            'min_threshold' => $this->min_threshold ? (float) $this->min_threshold : null,
            'is_low' => $this->isLow(),
            'last_movement_at' => $this->last_movement_at?->toISOString(),
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'name_ar' => $this->branch->name_ar,
                'type' => $this->branch->type->value,
            ]),
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id,
                'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name,
                'name_ar' => $this->crop->name_ar,
            ]),
            'latest_movement' => new InventoryMovementResource($this->whenLoaded('latestMovement')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
