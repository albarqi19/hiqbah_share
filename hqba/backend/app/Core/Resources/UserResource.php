<?php

namespace App\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_ar' => $this->name_ar,
            'email' => $this->email,
            'phone' => $this->phone,
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'is_active' => $this->is_active,
            'language' => $this->language,
            'avatar' => $this->avatar,
            'last_login_at' => $this->last_login_at,
            'roles' => $this->getRoleNames(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            'direct_permissions' => $this->getDirectPermissions()->pluck('name')->values(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
