<?php

namespace App\Modules\Sales\Events;

use App\Modules\Orders\Models\Customer;
use App\Modules\Sales\Models\Lead;
use Illuminate\Foundation\Events\Dispatchable;

class LeadConverted
{
    use Dispatchable;

    public function __construct(
        public Lead $lead,
        public Customer $customer,
    ) {}
}
