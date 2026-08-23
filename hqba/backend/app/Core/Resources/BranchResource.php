<?php

namespace App\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'type' => $this->type,
            'city' => $this->city,
            'address' => $this->address,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'settings' => $this->settings,
            'users_count' => $this->whenCounted('users'),
            'equipment_count' => $this->whenCounted('equipment'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
