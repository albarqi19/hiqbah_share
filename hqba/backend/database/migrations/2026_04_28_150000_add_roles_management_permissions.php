<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $newPermissions = [
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'roles.assign',
        ];

        foreach ($newPermissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Grant all new permissions to super_admin and admin
        foreach (['super_admin', 'admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->givePermissionTo($newPermissions);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::whereIn('name', [
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'roles.assign',
        ])->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
