<?php

namespace App\Modules\Inventory\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inventory_item_id' => $this->inventory_item_id,
            'branch_id' => $this->branch_id,
            'crop_id' => $this->crop_id,
            'movement_type' => $this->movement_type->value,
            'movement_type_label' => $this->movement_type->label(),
            'movement_type_label_en' => $this->movement_type->labelEn(),
            'direction' => $this->direction,
            'quantity' => (float) $this->quantity,
            'balance_after' => (float) $this->balance_after,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'cost_per_unit' => $this->cost_per_unit ? (float) $this->cost_per_unit : null,
            'total_cost' => $this->total_cost ? (float) $this->total_cost : null,
            'staff' => $this->whenLoaded('staff', fn () => [
                'id' => $this->staff->id,
                'name' => $this->staff->name,
                'name_ar' => $this->staff->name_ar,
            ]),
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'name_ar' => $this->branch->name_ar,
            ]),
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id,
                'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name,
                'name_ar' => $this->crop->name_ar,
            ]),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
