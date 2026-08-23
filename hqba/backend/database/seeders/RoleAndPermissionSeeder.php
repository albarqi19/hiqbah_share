<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Permissions ──
        $permissions = [
            // Branches
            'branches.view', 'branches.create', 'branches.update', 'branches.delete',
            // Equipment
            'equipment.view', 'equipment.create', 'equipment.update', 'equipment.delete',
            // Users
            'users.view', 'users.create', 'users.update', 'users.delete',
            // Roles & Permissions
            'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'roles.assign',
            // Settings
            'settings.view', 'settings.update',
            // Purchase Requisitions (pre-PO)
            'purchase_requisitions.view', 'purchase_requisitions.create', 'purchase_requisitions.update',
            'purchase_requisitions.approve', 'purchase_requisitions.delete',
            // Purchase Orders
            'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.update',
            'purchase_orders.approve', 'purchase_orders.delete',
            // Goods Receipt Notes (GRN)
            'grn.view', 'grn.create', 'grn.qc',
            // Suppliers
            'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.delete',
            // Crops
            'crops.view', 'crops.create', 'crops.update', 'crops.delete',
            'crops.receive', 'crops.inspect', 'crops.trial_roast', 'crops.cupping',
            'crops.approve', 'crops.pricing', 'crops.marketing',
            // Recipes
            'recipes.view', 'recipes.create', 'recipes.update', 'recipes.approve', 'recipes.publish',
            // Production
            'production.view', 'production.manage_queue', 'production.start_batch',
            'production.complete_batch', 'production.qc_check', 'production.reject_batch',
            'production.packaging',
            // Orders
            'orders.view', 'orders.create', 'orders.review', 'orders.approve',
            'orders.quote', 'orders.ship', 'orders.close',
            // Inventory
            'inventory.view', 'inventory.transfer_request', 'inventory.transfer_approve',
            'inventory.transfer_ship', 'inventory.transfer_receive',
            'inventory.audit', 'inventory.export',
            // Branch operations
            'calibration.perform', 'calibration.view',
            'cleaning.perform', 'cleaning.review',
            // Quality
            'quality.waste_view', 'quality.complaints_view', 'quality.complaints_create',
            // Reports
            'reports.view', 'reports.export',
            // Pricing
            'pricing.view', 'pricing.manage', 'pricing.approve',
            // Sales
            'sales.view', 'sales.manage',
            'leads.view', 'leads.manage',
            'commissions.view', 'commissions.approve', 'commissions.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Roles ──
        $roles = [
            'super_admin' => $permissions, // all permissions

            'admin' => array_filter($permissions, fn ($p) => !str_starts_with($p, 'settings.')),

            'accountant' => [
                'purchase_requisitions.view', 'purchase_requisitions.approve',
                'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.update', 'purchase_orders.approve',
                'grn.view',
                'suppliers.view', 'suppliers.create', 'suppliers.update',
                'crops.view', 'crops.pricing',
                'orders.view', 'orders.quote', 'orders.close',
                'inventory.view', 'inventory.audit', 'inventory.export',
                'reports.view', 'reports.export',
                'pricing.view',
                'commissions.view', 'commissions.approve',
            ],

            'sales_manager' => [
                'orders.view', 'orders.create', 'orders.review', 'orders.approve', 'orders.ship',
                'purchase_requisitions.view', 'purchase_requisitions.create', 'purchase_requisitions.update',
                'inventory.view',
                'crops.view',
                'reports.view',
                'pricing.view', 'pricing.manage',
                'sales.view', 'sales.manage',
                'leads.view', 'leads.manage',
                'commissions.view', 'commissions.approve', 'commissions.manage',
            ],

            'sales_rep' => [
                'orders.view', 'orders.create',
                'inventory.view',
                'crops.view',
                'pricing.view',
                'sales.view',
                'leads.view', 'leads.manage',
                'commissions.view',
            ],

            'master_roaster' => [
                'purchase_requisitions.view', 'purchase_requisitions.create', 'purchase_requisitions.update',
                'crops.view', 'crops.inspect', 'crops.trial_roast', 'crops.cupping', 'crops.approve',
                'recipes.view', 'recipes.create', 'recipes.update',
                'production.view', 'production.manage_queue', 'production.start_batch',
                'production.complete_batch', 'production.qc_check', 'production.reject_batch',
                'quality.waste_view',
            ],

            'roaster' => [
                'production.view', 'production.start_batch', 'production.complete_batch',
                'crops.view',
            ],

            'q_grader' => [
                'crops.view', 'crops.inspect', 'crops.cupping',
                'production.view', 'production.qc_check', 'production.reject_batch',
                'quality.waste_view', 'quality.complaints_view',
                'grn.view', 'grn.qc',
            ],

            'head_barista' => [
                'recipes.view', 'recipes.create', 'recipes.update',
                'calibration.perform', 'calibration.view',
                'cleaning.perform',
                'inventory.view', 'inventory.audit',
                'crops.view',
            ],

            'barista' => [
                'calibration.perform', 'calibration.view',
                'cleaning.perform',
                'recipes.view',
                'crops.view',
            ],

            'warehouse' => [
                'crops.view', 'crops.receive',
                'grn.view', 'grn.create',
                'inventory.view', 'inventory.transfer_receive', 'inventory.transfer_ship',
                'inventory.audit',
                'production.packaging',
            ],

            'packaging' => [
                'production.view', 'production.packaging',
                'inventory.view',
            ],

            'branch_manager' => [
                'calibration.perform', 'calibration.view',
                'cleaning.perform', 'cleaning.review',
                'recipes.view',
                'inventory.view', 'inventory.transfer_request', 'inventory.audit',
                'quality.waste_view', 'quality.complaints_view', 'quality.complaints_create',
                'reports.view',
                'crops.view',
                'equipment.view',
                'users.view',
            ],

            'marketing' => [
                'crops.view', 'crops.marketing',
                'orders.view',
                'reports.view',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePermissions);
        }
    }
}
