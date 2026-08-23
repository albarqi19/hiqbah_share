<?php

namespace App\Modules\Procurement\Resources;

use App\Core\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseRequisitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requisition_number' => $this->requisition_number,
            'requested_by' => $this->requested_by,
            'department' => $this->department instanceof \BackedEnum ? $this->department->value : $this->department,
            'urgency' => $this->urgency instanceof \BackedEnum ? $this->urgency->value : $this->urgency,
            'target_quantity_kg' => $this->target_quantity_kg,
            'target_price_per_kg' => $this->target_price_per_kg,
            'target_origin_country' => $this->target_origin_country,
            'target_region' => $this->target_region,
            'target_process' => $this->target_process,
            'target_variety' => $this->target_variety,
            'preferred_supplier_id' => $this->preferred_supplier_id,
            'needed_by' => $this->needed_by,
            'justification' => $this->justification,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'estimated_value' => $this->estimatedValue(),
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'rejection_reason' => $this->rejection_reason,
            'converted_to_po_id' => $this->converted_to_po_id,
            'converted_at' => $this->converted_at,
            'notes' => $this->notes,

            'requester' => new UserResource($this->whenLoaded('requester')),
            'approver' => new UserResource($this->whenLoaded('approver')),
            'preferred_supplier' => new SupplierResource($this->whenLoaded('preferredSupplier')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
