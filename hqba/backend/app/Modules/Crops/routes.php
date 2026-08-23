<?php

use App\Modules\Crops\Controllers\CropController;
use App\Modules\Crops\Controllers\CropMarketingController;
use App\Modules\Crops\Controllers\CropPricingController;
use App\Modules\Crops\Controllers\CuppingSessionController;
use App\Modules\Crops\Controllers\FileUploadController;
use App\Modules\Crops\Controllers\GreenCoffeeController;
use App\Modules\Crops\Controllers\TrialRoastController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    // Crops
    Route::get('crops', [CropController::class, 'index'])->middleware('permission:crops.view');
    Route::get('crops/{crop}', [CropController::class, 'show'])->middleware('permission:crops.view');
    Route::post('crops', [CropController::class, 'store'])->middleware('permission:crops.create');
    Route::put('crops/{crop}', [CropController::class, 'update'])->middleware('permission:crops.update');
    Route::patch('crops/{crop}', [CropController::class, 'update'])->middleware('permission:crops.update');
    Route::delete('crops/{crop}', [CropController::class, 'destroy'])->middleware('permission:crops.delete');
    Route::get('crops/{crop}/timeline', [CropController::class, 'timeline'])->middleware('permission:crops.view');
    Route::get('crops/{crop}/traceability', [CropController::class, 'traceability'])->middleware('permission:crops.view');
    Route::get('crops/{crop}/qr-code', [CropController::class, 'qrCode'])->middleware('permission:crops.view');

    // Green Coffee
    Route::post('green-coffee/receive', [GreenCoffeeController::class, 'receive'])->middleware('permission:crops.receive');
    Route::get('green-coffee/lots', [GreenCoffeeController::class, 'index'])->middleware('permission:crops.view');
    Route::get('green-coffee/lots/{greenCoffeeLot}', [GreenCoffeeController::class, 'show'])->middleware('permission:crops.view');
    Route::post('green-coffee/{greenCoffeeLot}/inspect', [GreenCoffeeController::class, 'inspect'])->middleware('permission:crops.inspect');
    Route::put('green-coffee/inspections/{greenCoffeeInspection}/decide', [GreenCoffeeController::class, 'decide'])->middleware('permission:crops.approve');

    // Trial Roasts
    Route::get('crops/{crop}/trial-roasts', [TrialRoastController::class, 'index'])->middleware('permission:crops.view');
    Route::post('crops/{crop}/trial-roasts', [TrialRoastController::class, 'store'])->middleware('permission:crops.trial_roast');
    Route::get('trial-roasts/{trialRoast}', [TrialRoastController::class, 'show'])->middleware('permission:crops.view');
    Route::put('trial-roasts/{trialRoast}', [TrialRoastController::class, 'update'])->middleware('permission:crops.trial_roast');
    Route::delete('trial-roasts/{trialRoast}', [TrialRoastController::class, 'destroy'])->middleware('permission:crops.trial_roast');
    Route::post('trial-roasts/{trialRoast}/complete', [TrialRoastController::class, 'complete'])->middleware('permission:crops.trial_roast');
    Route::post('trial-roasts/{trialRoast}/select', [TrialRoastController::class, 'select'])->middleware('permission:crops.approve');

    // Cupping Sessions
    Route::get('crops/{crop}/cupping-sessions', [CuppingSessionController::class, 'index'])->middleware('permission:crops.view');
    Route::post('crops/{crop}/cupping-sessions', [CuppingSessionController::class, 'store'])->middleware('permission:crops.cupping');
    Route::get('cupping-sessions/{cuppingSession}', [CuppingSessionController::class, 'show'])->middleware('permission:crops.view');
    Route::put('cupping-sessions/{cuppingSession}', [CuppingSessionController::class, 'update'])->middleware('permission:crops.cupping');
    Route::delete('cupping-sessions/{cuppingSession}', [CuppingSessionController::class, 'destroy'])->middleware('permission:crops.cupping');
    Route::post('cupping-sessions/{cuppingSession}/complete', [CuppingSessionController::class, 'complete'])->middleware('permission:crops.cupping');
    Route::post('cupping-sessions/{cuppingSession}/decide', [CuppingSessionController::class, 'decide'])->middleware('permission:crops.approve');

    // Pricing
    Route::get('crops/{crop}/pricing', [CropPricingController::class, 'show'])->middleware('permission:crops.view');
    Route::post('crops/{crop}/pricing', [CropPricingController::class, 'store'])->middleware('permission:crops.pricing');
    Route::put('crops/{crop}/pricing', [CropPricingController::class, 'update'])->middleware('permission:crops.pricing');
    Route::post('crops/{crop}/pricing/approve', [CropPricingController::class, 'approve'])->middleware('permission:pricing.approve');

    // Marketing
    Route::get('crops/{crop}/marketing', [CropMarketingController::class, 'show'])->middleware('permission:crops.view');
    Route::post('crops/{crop}/marketing', [CropMarketingController::class, 'store'])->middleware('permission:crops.marketing');
    Route::put('crops/{crop}/marketing', [CropMarketingController::class, 'update'])->middleware('permission:crops.marketing');
    Route::post('crops/{crop}/marketing/approve', [CropMarketingController::class, 'approve'])->middleware('permission:crops.marketing');
    Route::post('crops/{crop}/marketing/generate-label', [CropMarketingController::class, 'generateLabel'])->middleware('permission:crops.marketing');
    Route::get('crops/{crop}/marketing/export', [CropMarketingController::class, 'exportText'])->middleware('permission:crops.marketing');

    // File Upload (any authenticated user can upload)
    Route::post('upload', [FileUploadController::class, 'upload']);
});
