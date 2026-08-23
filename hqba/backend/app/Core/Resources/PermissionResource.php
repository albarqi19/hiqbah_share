<?php

namespace App\Core\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        [$resource, $action] = array_pad(explode('.', $this->name, 2), 2, null);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'resource' => $resource,
            'action' => $action,
            'guard_name' => $this->guard_name,
        ];
    }
}
