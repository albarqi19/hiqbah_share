<?php

namespace App\Modules\Crops\Events;

use App\Modules\Crops\Models\GreenCoffeeLot;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GreenCoffeeReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(public GreenCoffeeLot $greenCoffeeLot) {}
}
