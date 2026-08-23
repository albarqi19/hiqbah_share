<?php

use App\Modules\Quality\Controllers\ComplaintController;
use App\Modules\Quality\Controllers\MarketFeedbackController;
use App\Modules\Quality\Controllers\WasteRecordController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Waste records
    Route::get('waste-records', [WasteRecordController::class, 'index'])->middleware('permission:quality.waste_view');
    Route::get('waste-records/summary', [WasteRecordController::class, 'summary'])->middleware('permission:quality.waste_view');
    Route::get('waste-records/crop/{cropId}', [WasteRecordController::class, 'byCrop'])->middleware('permission:quality.waste_view');
    Route::get('quality/warnings', [WasteRecordController::class, 'warnings'])->middleware('permission:quality.waste_view');

    // Complaints
    Route::get('complaints', [ComplaintController::class, 'index'])->middleware('permission:quality.complaints_view');
    Route::post('complaints', [ComplaintController::class, 'store'])->middleware('permission:quality.complaints_create');
    Route::get('complaints/{complaint}', [ComplaintController::class, 'show'])->middleware('permission:quality.complaints_view');
    Route::put('complaints/{complaint}/investigate', [ComplaintController::class, 'investigate'])->middleware('permission:quality.complaints_view');
    Route::put('complaints/{complaint}/resolve', [ComplaintController::class, 'resolve'])->middleware('permission:quality.complaints_view');
    Route::put('complaints/{complaint}/corrective-action', [ComplaintController::class, 'correctiveAction'])->middleware('permission:quality.complaints_view');

    // Market Feedback
    Route::get('market-feedback', [MarketFeedbackController::class, 'index'])->middleware('permission:quality.complaints_view');
    Route::post('market-feedback', [MarketFeedbackController::class, 'store'])->middleware('permission:quality.complaints_create');
    Route::get('market-feedback/summary', [MarketFeedbackController::class, 'summary'])->middleware('permission:quality.complaints_view');
});
