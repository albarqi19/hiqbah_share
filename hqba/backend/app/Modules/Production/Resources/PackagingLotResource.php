<?php

namespace App\Modules\Production\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackagingLotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lot_number' => $this->lot_number,
            'crop_id' => $this->crop_id,
            'roast_batch_id' => $this->roast_batch_id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'package_size' => $this->package_size,
            'bags_count' => $this->bags_count,
            'roasted_weight_used_kg' => (float) $this->roasted_weight_used_kg,
            'net_weight_per_bag_g' => (float) $this->net_weight_per_bag_g,
            'total_net_weight_kg' => (float) $this->total_net_weight_kg,
            'packaging_waste_g' => $this->packaging_waste_g ? (float) $this->packaging_waste_g : null,
            'sku' => $this->sku,
            'qr_data' => $this->qr_data,
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id, 'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name, 'name_ar' => $this->crop->name_ar,
            ]),
            'roast_batch' => $this->whenLoaded('roastBatch', fn () => [
                'id' => $this->roastBatch->id, 'batch_number' => $this->roastBatch->batch_number,
            ]),
            'packer' => $this->whenLoaded('packer', fn () => [
                'id' => $this->packer->id, 'name' => $this->packer->name, 'name_ar' => $this->packer->name_ar,
            ]),
            'packed_at' => $this->packed_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
