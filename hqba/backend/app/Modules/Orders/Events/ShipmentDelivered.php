<?php

namespace App\Modules\Orders\Events;

use App\Modules\Orders\Models\Shipment;
use Illuminate\Foundation\Events\Dispatchable;

class ShipmentDelivered
{
    use Dispatchable;

    public function __construct(public Shipment $shipment) {}
}
