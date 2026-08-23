<?php

namespace App\Modules\Procurement\Events;

use App\Modules\Procurement\Models\GoodsReceiptNote;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GoodsAccepted
{
    use Dispatchable, SerializesModels;

    public function __construct(public GoodsReceiptNote $grn) {}
}
