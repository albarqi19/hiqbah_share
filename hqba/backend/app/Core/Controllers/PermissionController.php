<?php

namespace App\Core\Controllers;

use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;

class PermissionController extends ApiController
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()
            ->orderBy('name')
            ->get(['id', 'name', 'guard_name']);

        $grouped = $permissions
            ->groupBy(fn ($p) => explode('.', $p->name, 2)[0])
            ->map(function ($items, $resource) {
                return [
                    'resource' => $resource,
                    'permissions' => $items->map(fn ($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'action' => explode('.', $p->name, 2)[1] ?? null,
                    ])->values(),
                ];
            })
            ->values();

        return $this->success($grouped);
    }
}
