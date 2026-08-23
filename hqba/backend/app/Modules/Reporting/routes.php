<?php

use App\Modules\Reporting\Controllers\AccountingExportController;
use App\Modules\Reporting\Controllers\ActivityLogController;
use App\Modules\Reporting\Controllers\DashboardController;
use App\Modules\Reporting\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    Route::get('dashboard/admin', [DashboardController::class, 'admin'])->middleware('permission:reports.view');
    Route::get('dashboard/quality', [DashboardController::class, 'quality'])->middleware('permission:reports.view');
    Route::get('reports/crop/{id}', [ReportController::class, 'cropReport'])->middleware('permission:reports.view');
    Route::get('reports/waste', [ReportController::class, 'wasteReport'])->middleware('permission:reports.view');
    Route::get('activity-log', [ActivityLogController::class, 'index'])->middleware('permission:reports.view');
    Route::post('accounting/export', [AccountingExportController::class, 'export'])->middleware('permission:reports.export');
});
