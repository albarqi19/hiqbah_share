<?php

namespace App\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public const SYSTEM_ROLES = ['super_admin', 'admin'];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name,
            'is_system' => in_array($this->name, self::SYSTEM_ROLES, true),
            'permissions' => $this->whenLoaded('permissions', fn () => $this->permissions->pluck('name')),
            'permissions_count' => $this->when(isset($this->permissions_count), $this->permissions_count),
            'users_count' => $this->when(isset($this->users_count), $this->users_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
