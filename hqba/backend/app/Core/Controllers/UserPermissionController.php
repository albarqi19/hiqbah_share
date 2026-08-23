<?php

namespace App\Core\Controllers;

use App\Core\Models\User;
use App\Core\Requests\SyncUserPermissionsRequest;
use App\Core\Requests\SyncUserRolesRequest;
use App\Core\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\PermissionRegistrar;

class UserPermissionController extends ApiController
{
    public function show(User $user): JsonResponse
    {
        $user->load(['roles.permissions:id,name', 'permissions:id,name']);

        $rolePermissions = $user->roles
            ->flatMap(fn ($role) => $role->permissions->pluck('name'))
            ->unique()
            ->values();

        $directPermissions = $user->permissions->pluck('name')->values();

        return $this->success([
            'user_id' => $user->id,
            'roles' => $user->roles->pluck('name'),
            'role_permissions' => $rolePermissions,
            'direct_permissions' => $directPermissions,
            'all_permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    }

    public function syncPermissions(SyncUserPermissionsRequest $request, User $user): JsonResponse
    {
        $user->syncPermissions($request->validated()['permissions']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user->load(['branch', 'roles', 'permissions']);

        return $this->success(new UserResource($user));
    }

    public function syncRoles(SyncUserRolesRequest $request, User $user): JsonResponse
    {
        $user->syncRoles($request->validated()['roles']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user->load(['branch', 'roles', 'permissions']);

        return $this->success(new UserResource($user));
    }
}
