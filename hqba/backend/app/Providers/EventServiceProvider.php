<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \App\Core\Events\UserCreated::class => [
            \App\Modules\Whatsapp\Listeners\SendUserWelcomeWhatsapp::class,
        ],
        \App\Modules\Procurement\Events\PurchaseOrderApproved::class => [
            \App\Modules\Crops\Listeners\OnPurchaseOrderApproved::class,
        ],
        \App\Modules\Crops\Events\CuppingCompleted::class => [
            \App\Modules\Quality\Listeners\OnCuppingCompleted::class,
        ],
        \App\Modules\Crops\Events\TrialRoastCompleted::class => [
            \App\Modules\Crops\Listeners\OnTrialRoastCompleted::class,
        ],
        \App\Modules\Crops\Events\GreenCoffeeReceived::class => [
            \App\Modules\Inventory\Listeners\OnGreenCoffeeReceived::class,
        ],
        \App\Modules\Inventory\Events\InventoryLow::class => [
            \App\Modules\Inventory\Listeners\OnInventoryLow::class,
        ],
        \App\Modules\Production\Events\RoastBatchStarted::class => [
            \App\Modules\Inventory\Listeners\OnRoastBatchStarted::class,
        ],
        \App\Modules\Production\Events\RoastBatchCompleted::class => [
            \App\Modules\Inventory\Listeners\OnRoastBatchCompleted::class,
        ],
        \App\Modules\Production\Events\QualityCheckDone::class => [
            \App\Modules\Inventory\Listeners\OnQualityCheckDone::class,
        ],
        \App\Modules\Production\Events\PackagingCompleted::class => [
            \App\Modules\Inventory\Listeners\OnPackagingCompleted::class,
        ],
        \App\Modules\Branch\Events\CalibrationCompleted::class => [
            \App\Modules\Inventory\Listeners\OnCalibrationCompleted::class,
        ],
        \App\Modules\Recipes\Events\RecipePublished::class => [
            \App\Modules\Recipes\Listeners\OnRecipePublished::class,
        ],
        \App\Modules\Orders\Events\OrderPaid::class => [
            \App\Modules\Orders\Listeners\CalculateCommissionOnPayment::class,
        ],
    ];
}
