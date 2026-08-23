<?php

use App\Modules\Inventory\Controllers\AuditController;
use App\Modules\Inventory\Controllers\InventoryController;
use App\Modules\Inventory\Controllers\TransferController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Inventory
    Route::get('inventory/movements', [InventoryController::class, 'movements'])->middleware('permission:inventory.view');
    Route::get('inventory/alerts', [InventoryController::class, 'alerts'])->middleware('permission:inventory.view');
    Route::get('inventory/summary', [InventoryController::class, 'summary'])->middleware('permission:inventory.view');
    Route::get('inventory/valuation', [InventoryController::class, 'valuation'])->middleware('permission:inventory.export');
    Route::post('inventory/adjust', [InventoryController::class, 'adjust'])->middleware('permission:inventory.audit');
    Route::post('inventory/reconcile', [InventoryController::class, 'reconcile'])->middleware('permission:inventory.audit');
    Route::get('inventory/{inventoryItem}', [InventoryController::class, 'show'])->middleware('permission:inventory.view');
    Route::put('inventory/{inventoryItem}/threshold', [InventoryController::class, 'setThreshold'])->middleware('permission:inventory.audit');
    Route::get('inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view');

    // Transfers
    Route::get('transfers', [TransferController::class, 'index'])->middleware('permission:inventory.view');
    Route::post('transfers', [TransferController::class, 'store'])->middleware('permission:inventory.transfer_request');
    Route::get('transfers/{transferOrder}', [TransferController::class, 'show'])->middleware('permission:inventory.view');
    Route::put('transfers/{transferOrder}/approve', [TransferController::class, 'approve'])->middleware('permission:inventory.transfer_approve');
    Route::put('transfers/{transferOrder}/ship', [TransferController::class, 'ship'])->middleware('permission:inventory.transfer_ship');
    Route::put('transfers/{transferOrder}/receive', [TransferController::class, 'receive'])->middleware('permission:inventory.transfer_receive');
    Route::put('transfers/{transferOrder}/confirm', [TransferController::class, 'confirm'])->middleware('permission:inventory.transfer_receive');

    // Audits
    Route::get('audits', [AuditController::class, 'index'])->middleware('permission:inventory.audit');
    Route::post('audits', [AuditController::class, 'store'])->middleware('permission:inventory.audit');
    Route::get('audits/{audit}', [AuditController::class, 'show'])->middleware('permission:inventory.audit');
    Route::put('audits/{audit}/items/{item}', [AuditController::class, 'countItem'])->middleware('permission:inventory.audit');
    Route::put('audits/{audit}/approve', [AuditController::class, 'approve'])->middleware('permission:inventory.audit');
    Route::put('audits/{audit}/close', [AuditController::class, 'close'])->middleware('permission:inventory.audit');
});
