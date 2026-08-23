<?php

namespace App\Modules\Production\Events;

use App\Modules\Production\Models\RoastBatch;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoastBatchStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(public RoastBatch $roastBatch) {}
}
