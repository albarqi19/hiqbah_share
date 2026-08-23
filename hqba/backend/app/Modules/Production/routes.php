<?php

use App\Modules\Production\Controllers\PackagingController;
use App\Modules\Production\Controllers\QualityCheckController;
use App\Modules\Production\Controllers\RoastingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Roasting
    Route::get('roasting/queue', [RoastingController::class, 'queue'])->middleware('permission:production.view');
    Route::post('roasting/batches', [RoastingController::class, 'store'])->middleware('permission:production.manage_queue');
    Route::post('roasting/batches/reorder', [RoastingController::class, 'reorder'])->middleware('permission:production.manage_queue');
    Route::get('roasting/batches/{roastBatch}', [RoastingController::class, 'show'])->middleware('permission:production.view');
    Route::put('roasting/batches/{roastBatch}/start', [RoastingController::class, 'start'])->middleware('permission:production.start_batch');
    Route::put('roasting/batches/{roastBatch}/complete', [RoastingController::class, 'complete'])->middleware('permission:production.complete_batch');

    // Quality Checks
    Route::get('quality-checks/pending', [QualityCheckController::class, 'pending'])->middleware('permission:production.qc_check');
    Route::post('roasting/batches/{roastBatch}/quality-check', [QualityCheckController::class, 'store'])->middleware('permission:production.qc_check');
    Route::put('quality-checks/{qualityCheck}/decide', [QualityCheckController::class, 'decide'])->middleware('permission:production.qc_check');

    // Packaging
    Route::get('packaging/lots', [PackagingController::class, 'index'])->middleware('permission:production.view');
    Route::post('packaging/lots', [PackagingController::class, 'store'])->middleware('permission:production.packaging');
    Route::get('packaging/lots/{packagingLot}', [PackagingController::class, 'show'])->middleware('permission:production.view');
    Route::put('packaging/lots/{packagingLot}/complete', [PackagingController::class, 'complete'])->middleware('permission:production.packaging');
});
