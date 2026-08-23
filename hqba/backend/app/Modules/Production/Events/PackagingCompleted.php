<?php

namespace App\Modules\Production\Events;

use App\Modules\Production\Models\PackagingLot;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PackagingCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public PackagingLot $packagingLot) {}
}
