<?php

use App\Modules\Pricing\Controllers\DiscountController;
use App\Modules\Pricing\Controllers\PriceListController;
use App\Modules\Pricing\Controllers\PriceListItemController;
use App\Modules\Pricing\Controllers\PricingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Price Lists
    Route::get('price-lists', [PriceListController::class, 'index'])->middleware('permission:pricing.view');
    Route::get('price-lists/{priceList}', [PriceListController::class, 'show'])->middleware('permission:pricing.view');
    Route::post('price-lists', [PriceListController::class, 'store'])->middleware('permission:pricing.manage');
    Route::put('price-lists/{priceList}', [PriceListController::class, 'update'])->middleware('permission:pricing.manage');
    Route::patch('price-lists/{priceList}', [PriceListController::class, 'update'])->middleware('permission:pricing.manage');
    Route::put('price-lists/{priceList}/approve', [PriceListController::class, 'approve'])->middleware('permission:pricing.approve');
    Route::put('price-lists/{priceList}/archive', [PriceListController::class, 'archive'])->middleware('permission:pricing.manage');

    // Price List Items
    Route::get('price-lists/{priceList}/items', [PriceListItemController::class, 'index'])->middleware('permission:pricing.view');
    Route::post('price-lists/{priceList}/items', [PriceListItemController::class, 'store'])->middleware('permission:pricing.manage');
    Route::put('price-lists/{priceList}/items/{item}', [PriceListItemController::class, 'update'])->middleware('permission:pricing.manage');
    Route::delete('price-lists/{priceList}/items/{item}', [PriceListItemController::class, 'destroy'])->middleware('permission:pricing.manage');
    Route::post('price-lists/{priceList}/items/bulk', [PriceListItemController::class, 'bulkStore'])->middleware('permission:pricing.manage');

    // Price Resolution
    Route::get('pricing/resolve', [PricingController::class, 'resolve'])->middleware('permission:pricing.view');
    Route::post('pricing/resolve-batch', [PricingController::class, 'resolveBatch'])->middleware('permission:pricing.view');
    Route::post('pricing/simulate-margin', [PricingController::class, 'simulateMargin'])->middleware('permission:pricing.manage');
    Route::get('price-change-logs', [PricingController::class, 'changeLogs'])->middleware('permission:pricing.view');

    // Discounts
    Route::get('discounts', [DiscountController::class, 'index'])->middleware('permission:pricing.view');
    Route::get('discounts/{discount}', [DiscountController::class, 'show'])->middleware('permission:pricing.view');
    Route::post('discounts', [DiscountController::class, 'store'])->middleware('permission:pricing.manage');
    Route::put('discounts/{discount}', [DiscountController::class, 'update'])->middleware('permission:pricing.manage');
    Route::patch('discounts/{discount}', [DiscountController::class, 'update'])->middleware('permission:pricing.manage');
    Route::put('discounts/{discount}/deactivate', [DiscountController::class, 'deactivate'])->middleware('permission:pricing.manage');
    Route::post('discounts/validate-code', [DiscountController::class, 'validateCode'])->middleware('permission:pricing.view');
});
