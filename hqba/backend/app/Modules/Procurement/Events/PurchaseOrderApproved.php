<?php

namespace App\Modules\Procurement\Events;

use App\Modules\Procurement\Models\PurchaseOrder;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(public PurchaseOrder $purchaseOrder) {}
}
