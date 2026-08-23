<?php

namespace App\Modules\Sales\Events;

use App\Modules\Sales\Models\Commission;
use Illuminate\Foundation\Events\Dispatchable;

class CommissionCreated
{
    use Dispatchable;

    public function __construct(public Commission $commission) {}
}
