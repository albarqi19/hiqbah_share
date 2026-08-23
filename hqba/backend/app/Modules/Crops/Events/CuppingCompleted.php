<?php

namespace App\Modules\Crops\Events;

use App\Modules\Crops\Models\CuppingSession;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CuppingCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public CuppingSession $cuppingSession) {}
}
