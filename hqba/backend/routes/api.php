<?php

use App\Core\Controllers\AuthController;
use App\Core\Controllers\BranchController;
use App\Core\Controllers\EquipmentController;
use App\Core\Controllers\NotificationController;
use App\Core\Controllers\PermissionController;
use App\Core\Controllers\RoleController;
use App\Core\Controllers\SettingController;
use App\Core\Controllers\UserController;
use App\Core\Controllers\UserPermissionController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ──
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/pin-login', [AuthController::class, 'pinLogin']);

// ── Authenticated Routes ──
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('auth/user', [AuthController::class, 'user']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Branches
    Route::get('branches', [BranchController::class, 'index'])->middleware('permission:branches.view');
    Route::get('branches/{branch}', [BranchController::class, 'show'])->middleware('permission:branches.view');
    Route::post('branches', [BranchController::class, 'store'])->middleware('permission:branches.create');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->middleware('permission:branches.update');
    Route::patch('branches/{branch}', [BranchController::class, 'update'])->middleware('permission:branches.update');
    Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->middleware('permission:branches.delete');

    // Equipment
    Route::get('equipment', [EquipmentController::class, 'index'])->middleware('permission:equipment.view');
    Route::get('equipment/{equipment}', [EquipmentController::class, 'show'])->middleware('permission:equipment.view');
    Route::post('equipment', [EquipmentController::class, 'store'])->middleware('permission:equipment.create');
    Route::put('equipment/{equipment}', [EquipmentController::class, 'update'])->middleware('permission:equipment.update');
    Route::patch('equipment/{equipment}', [EquipmentController::class, 'update'])->middleware('permission:equipment.update');
    Route::delete('equipment/{equipment}', [EquipmentController::class, 'destroy'])->middleware('permission:equipment.delete');

    // Users
    Route::get('users', [UserController::class, 'index'])->middleware('permission:users.view');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
    Route::post('users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::patch('users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])->middleware('permission:users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');

    // User permissions / roles assignment
    Route::get('users/{user}/permissions', [UserPermissionController::class, 'show'])->middleware('permission:users.view');
    Route::put('users/{user}/permissions', [UserPermissionController::class, 'syncPermissions'])->middleware('permission:roles.assign');
    Route::put('users/{user}/roles', [UserPermissionController::class, 'syncRoles'])->middleware('permission:roles.assign');

    // Roles
    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:roles.view');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
    Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->middleware('permission:roles.update');

    // Permissions catalog
    Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:roles.view');

    // Settings
    Route::get('settings', [SettingController::class, 'index'])->middleware('permission:settings.view');
    Route::put('settings', [SettingController::class, 'update'])->middleware('permission:settings.update');

    // Notifications (no permission gate — every authenticated user sees their own)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
});
