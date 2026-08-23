<?php

namespace App\Modules\Sales\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'company_name_ar' => $this->company_name_ar,
            'contact_name' => $this->contact_name,
            'contact_name_ar' => $this->contact_name_ar,
            'email' => $this->email,
            'phone' => $this->phone,
            'city' => $this->city,
            'address' => $this->address,
            'stage' => $this->stage->value,
            'stage_label' => $this->stage->label(),
            'stage_label_en' => $this->stage->labelEn(),
            'source' => $this->source,
            'notes' => $this->notes,
            'estimated_monthly_kg' => $this->estimated_monthly_kg ? (float) $this->estimated_monthly_kg : null,
            'sales_rep_id' => $this->sales_rep_id,
            'sales_rep' => $this->whenLoaded('salesRep', fn () => [
                'id' => $this->salesRep->id,
                'name' => $this->salesRep->name,
                'name_ar' => $this->salesRep->name_ar,
            ]),
            'converted_customer_id' => $this->converted_customer_id,
            'converted_customer' => $this->whenLoaded('convertedCustomer', fn () => [
                'id' => $this->convertedCustomer->id,
                'name' => $this->convertedCustomer->name,
                'name_ar' => $this->convertedCustomer->name_ar,
            ]),
            'contacted_at' => $this->contacted_at?->toISOString(),
            'quoted_at' => $this->quoted_at?->toISOString(),
            'converted_at' => $this->converted_at?->toISOString(),
            'lost_at' => $this->lost_at?->toISOString(),
            'lost_reason' => $this->lost_reason,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
