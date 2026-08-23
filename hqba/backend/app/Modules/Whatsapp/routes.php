<?php

use App\Modules\Whatsapp\Controllers\WhatsappInstanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1/whatsapp')->group(function () {
    Route::get('instances', [WhatsappInstanceController::class, 'index']);
    Route::post('instances', [WhatsappInstanceController::class, 'store']);
    Route::get('instances/{instance}', [WhatsappInstanceController::class, 'show']);
    Route::get('instances/{instance}/qr', [WhatsappInstanceController::class, 'qr']);
    Route::get('instances/{instance}/status', [WhatsappInstanceController::class, 'status']);
    Route::delete('instances/{instance}', [WhatsappInstanceController::class, 'destroy']);
    Route::post('instances/{instance}/delete', [WhatsappInstanceController::class, 'destroy']);

    Route::post('send', [WhatsappInstanceController::class, 'send']);
    Route::get('messages', [WhatsappInstanceController::class, 'messages']);
});
