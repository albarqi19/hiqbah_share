<?php

use App\Modules\Procurement\Controllers\GoodsReceiptNoteController;
use App\Modules\Procurement\Controllers\PurchaseOrderController;
use App\Modules\Procurement\Controllers\PurchaseRequisitionController;
use App\Modules\Procurement\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // ── Suppliers ──
    Route::get('suppliers', [SupplierController::class, 'index'])->middleware('permission:suppliers.view');
    Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('permission:suppliers.view');
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('permission:suppliers.create');
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update');
    Route::patch('suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update');
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('permission:suppliers.delete');

    // ── Purchase Requisitions ──
    Route::get('purchase-requisitions', [PurchaseRequisitionController::class, 'index'])->middleware('permission:purchase_requisitions.view');
    Route::get('purchase-requisitions/{requisition}', [PurchaseRequisitionController::class, 'show'])->middleware('permission:purchase_requisitions.view');
    Route::post('purchase-requisitions', [PurchaseRequisitionController::class, 'store'])->middleware('permission:purchase_requisitions.create');
    Route::put('purchase-requisitions/{requisition}', [PurchaseRequisitionController::class, 'update'])->middleware('permission:purchase_requisitions.update');
    Route::patch('purchase-requisitions/{requisition}', [PurchaseRequisitionController::class, 'update'])->middleware('permission:purchase_requisitions.update');
    Route::delete('purchase-requisitions/{requisition}', [PurchaseRequisitionController::class, 'destroy'])->middleware('permission:purchase_requisitions.delete');
    Route::post('purchase-requisitions/{requisition}/submit', [PurchaseRequisitionController::class, 'submit'])->middleware('permission:purchase_requisitions.update');
    Route::post('purchase-requisitions/{requisition}/approve', [PurchaseRequisitionController::class, 'approve'])->middleware('permission:purchase_requisitions.approve');
    Route::post('purchase-requisitions/{requisition}/reject', [PurchaseRequisitionController::class, 'reject'])->middleware('permission:purchase_requisitions.approve');
    Route::post('purchase-requisitions/{requisition}/cancel', [PurchaseRequisitionController::class, 'cancel'])->middleware('permission:purchase_requisitions.update');

    // ── Purchase Orders ──
    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->middleware('permission:purchase_orders.view');
    Route::get('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'show'])->middleware('permission:purchase_orders.view');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:purchase_orders.create');
    Route::put('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'update'])->middleware('permission:purchase_orders.update');
    Route::patch('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'update'])->middleware('permission:purchase_orders.update');
    Route::delete('purchase-orders/{purchase_order}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:purchase_orders.delete');
    Route::post('purchase-orders/{purchase_order}/submit', [PurchaseOrderController::class, 'submit'])->middleware('permission:purchase_orders.update');
    Route::post('purchase-orders/{purchase_order}/approve', [PurchaseOrderController::class, 'approve'])->middleware('permission:purchase_orders.approve');
    Route::post('purchase-orders/{purchase_order}/reject', [PurchaseOrderController::class, 'reject'])->middleware('permission:purchase_orders.approve');
    Route::put('purchase-orders/{purchase_order}/status', [PurchaseOrderController::class, 'transition'])->middleware('permission:purchase_orders.update');
    Route::post('purchase-orders/{purchase_order}/cancel', [PurchaseOrderController::class, 'cancel'])->middleware('permission:purchase_orders.update');

    // ── Goods Receipt Notes ──
    Route::get('goods-receipt-notes', [GoodsReceiptNoteController::class, 'index'])->middleware('permission:grn.view');
    Route::get('goods-receipt-notes/{grn}', [GoodsReceiptNoteController::class, 'show'])->middleware('permission:grn.view');
    Route::post('purchase-orders/{purchase_order}/receive', [GoodsReceiptNoteController::class, 'store'])->middleware('permission:grn.create');
    Route::post('goods-receipt-notes/{grn}/start-qc', [GoodsReceiptNoteController::class, 'startQualityCheck'])->middleware('permission:grn.qc');
    Route::post('goods-receipt-notes/{grn}/complete-qc', [GoodsReceiptNoteController::class, 'completeQualityCheck'])->middleware('permission:grn.qc');
});
