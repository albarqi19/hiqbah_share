<?php

namespace App\Modules\Crops\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropMarketingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'product_name' => $this->product_name,
            'product_name_ar' => $this->product_name_ar,
            'marketing_description' => $this->marketing_description,
            'marketing_description_ar' => $this->marketing_description_ar,
            'flavor_display' => $this->flavor_display,
            'label_template' => $this->label_template,
            'label_pdf_url' => $this->label_pdf_url,
            'social_media_text' => $this->social_media_text,
            'social_media_text_ar' => $this->social_media_text_ar,
            'photos' => $this->photos,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'crop' => new CropResource($this->whenLoaded('crop')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
