<?php

use App\Modules\Branch\Controllers\AiCalibrationController;
use App\Modules\Branch\Controllers\CalibrationController;
use App\Modules\Branch\Controllers\CleaningController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Calibration
    Route::get('calibration/barista-stats', [CalibrationController::class, 'baristaStats'])->middleware('permission:calibration.view');
    Route::get('calibration/sessions', [CalibrationController::class, 'index'])->middleware('permission:calibration.view');
    Route::post('calibration/sessions', [CalibrationController::class, 'store'])->middleware('permission:calibration.perform');
    Route::get('calibration/sessions/{calibrationSession}', [CalibrationController::class, 'show'])->middleware('permission:calibration.view');
    Route::post('calibration/sessions/{calibrationSession}/shots', [CalibrationController::class, 'addShot'])->middleware('permission:calibration.perform');
    Route::put('calibration/sessions/{calibrationSession}/finish', [CalibrationController::class, 'finish'])->middleware('permission:calibration.perform');
    Route::put('calibration/sessions/{calibrationSession}/approve', [CalibrationController::class, 'approve'])->middleware('permission:calibration.view');

    // Cleaning
    Route::get('cleaning/schedules', [CleaningController::class, 'schedules'])->middleware('permission:cleaning.perform');
    Route::post('cleaning/schedules', [CleaningController::class, 'storeSchedule'])->middleware('permission:cleaning.review');
    Route::get('cleaning/tasks/today', [CleaningController::class, 'todayTasks'])->middleware('permission:cleaning.perform');
    Route::put('cleaning/tasks/{cleaningTask}/start', [CleaningController::class, 'startTask'])->middleware('permission:cleaning.perform');
    Route::put('cleaning/tasks/{cleaningTask}/complete', [CleaningController::class, 'completeTask'])->middleware('permission:cleaning.perform');
    Route::put('cleaning/tasks/{cleaningTask}/review', [CleaningController::class, 'reviewTask'])->middleware('permission:cleaning.review');
    Route::get('cleaning/score', [CleaningController::class, 'score'])->middleware('permission:cleaning.perform');

    // AI Calibration
    Route::post('calibration/ai-analyze', [AiCalibrationController::class, 'analyze'])->middleware('permission:calibration.perform');
    Route::get('calibration/ai-suggestions', [AiCalibrationController::class, 'suggestions'])->middleware('permission:calibration.perform');
});
