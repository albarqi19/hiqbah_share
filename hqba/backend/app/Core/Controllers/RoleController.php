<?php

namespace App\Core\Controllers;

use App\Core\Requests\StoreRoleRequest;
use App\Core\Requests\SyncRolePermissionsRequest;
use App\Core\Requests\UpdateRoleRequest;
use App\Core\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends ApiController
{
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->withCount(['permissions', 'users'])
            ->with('permissions:id,name')
            ->orderBy('name')
            ->get();

        return $this->success(RoleResource::collection($roles));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $data = $request->validated();

        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        $this->forgetCache();

        $role->load('permissions:id,name');
        $role->loadCount(['permissions', 'users']);

        return $this->created(new RoleResource($role));
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions:id,name');
        $role->loadCount(['permissions', 'users']);

        return $this->success(new RoleResource($role));
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if (in_array($role->name, RoleResource::SYSTEM_ROLES, true)) {
            return $this->forbidden('System roles cannot be renamed.');
        }

        $role->update($request->validated());

        $this->forgetCache();

        $role->load('permissions:id,name');
        $role->loadCount(['permissions', 'users']);

        return $this->success(new RoleResource($role));
    }

    public function destroy(Role $role): JsonResponse
    {
        if (in_array($role->name, RoleResource::SYSTEM_ROLES, true)) {
            return $this->forbidden('System roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            return $this->error('Cannot delete a role that is assigned to users.', 422);
        }

        $role->delete();
        $this->forgetCache();

        return $this->noContent();
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        if ($role->name === 'super_admin') {
            return $this->forbidden('Permissions of super_admin cannot be modified.');
        }

        $role->syncPermissions($request->validated()['permissions']);
        $this->forgetCache();

        $role->load('permissions:id,name');
        $role->loadCount(['permissions', 'users']);

        return $this->success(new RoleResource($role));
    }

    protected function forgetCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
