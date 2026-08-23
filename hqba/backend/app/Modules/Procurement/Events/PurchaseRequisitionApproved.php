<?php

namespace App\Modules\Procurement\Events;

use App\Modules\Procurement\Models\PurchaseRequisition;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PurchaseRequisitionApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(public PurchaseRequisition $requisition) {}
}
