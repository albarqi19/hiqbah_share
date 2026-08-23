<?php

use App\Modules\Recipes\Controllers\RecipeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {
    Route::get('recipes', [RecipeController::class, 'index'])->middleware('permission:recipes.view');
    Route::get('recipes/{recipe}', [RecipeController::class, 'show'])->middleware('permission:recipes.view');
    Route::post('recipes', [RecipeController::class, 'store'])->middleware('permission:recipes.create');
    Route::put('recipes/{recipe}', [RecipeController::class, 'update'])->middleware('permission:recipes.update');
    Route::patch('recipes/{recipe}', [RecipeController::class, 'update'])->middleware('permission:recipes.update');
    Route::delete('recipes/{recipe}', [RecipeController::class, 'destroy'])->middleware('permission:recipes.update');
    Route::post('recipes/{recipe}/espresso-trials', [RecipeController::class, 'addTrial'])->middleware('permission:recipes.update');
    Route::post('recipes/{recipe}/pour-over', [RecipeController::class, 'savePourOver'])->middleware('permission:recipes.update');
    Route::post('recipes/{recipe}/select-best-shot', [RecipeController::class, 'selectBestShot'])->middleware('permission:recipes.update');
    Route::post('recipes/{recipe}/create-version', [RecipeController::class, 'createVersion'])->middleware('permission:recipes.update');
    Route::post('recipes/{recipe}/approve', [RecipeController::class, 'approve'])->middleware('permission:recipes.approve');
    Route::post('recipes/{recipe}/publish', [RecipeController::class, 'publish'])->middleware('permission:recipes.publish');
});
