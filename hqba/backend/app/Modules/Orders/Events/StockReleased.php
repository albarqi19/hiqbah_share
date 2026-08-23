<?php

namespace App\Modules\Orders\Events;

use App\Modules\Orders\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;

class StockReleased
{
    use Dispatchable;

    public function __construct(public Order $order) {}
}
