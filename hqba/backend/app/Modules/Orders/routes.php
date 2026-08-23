<?php

use App\Modules\Orders\Controllers\CustomerController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Orders\Controllers\ShipmentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Customers
    Route::get('customers', [CustomerController::class, 'index'])->middleware('permission:orders.view');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:orders.view');
    Route::post('customers', [CustomerController::class, 'store'])->middleware('permission:orders.create');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:orders.create');
    Route::patch('customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:orders.create');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:orders.create');
    Route::post('customers/sync-branches', [CustomerController::class, 'syncBranches'])->middleware('permission:orders.create');

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->middleware('permission:orders.view');
    Route::post('orders', [OrderController::class, 'store'])->middleware('permission:orders.create');
    Route::get('orders/overdue-payments', [OrderController::class, 'overduePayments'])->middleware('permission:orders.view');
    Route::get('orders/{order}', [OrderController::class, 'show'])->middleware('permission:orders.view');
    Route::put('orders/{order}/transition', [OrderController::class, 'transition'])->middleware('permission:orders.review');
    Route::get('orders/{order}/inventory-check', [OrderController::class, 'inventoryCheck'])->middleware('permission:orders.view');
    Route::put('orders/{order}/payment', [OrderController::class, 'confirmPayment'])->middleware('permission:orders.review');
    Route::put('orders/{order}/cancel', [OrderController::class, 'cancel'])->middleware('permission:orders.review');

    // Quote
    Route::post('orders/{order}/generate-quote', [OrderController::class, 'generateQuote'])->middleware('permission:orders.quote');
    Route::get('orders/{order}/quote-pdf', [OrderController::class, 'quotePdf'])->middleware('permission:orders.view');

    // Stock Allocation
    Route::post('orders/{order}/allocate-stock', [OrderController::class, 'allocateStock'])->middleware('permission:orders.review');
    Route::post('orders/{order}/release-allocations', [OrderController::class, 'releaseAllocations'])->middleware('permission:orders.review');
    Route::get('orders/{order}/allocations', [OrderController::class, 'allocations'])->middleware('permission:orders.view');

    // Discount
    Route::post('orders/{order}/apply-discount', [OrderController::class, 'applyDiscount'])->middleware('permission:orders.approve');

    // Shipments
    Route::get('orders/{order}/shipments', [ShipmentController::class, 'index'])->middleware('permission:orders.view');
    Route::post('orders/{order}/shipments', [ShipmentController::class, 'store'])->middleware('permission:orders.ship');
    Route::put('shipments/{shipment}/confirm-delivery', [ShipmentController::class, 'confirmDelivery'])->middleware('permission:orders.ship');

    // Documents
    Route::get('orders/{order}/packing-slip', [OrderController::class, 'packingSlip'])->middleware('permission:orders.view');
    Route::get('orders/{order}/shipping-label', [OrderController::class, 'shippingLabel'])->middleware('permission:orders.view');
});
