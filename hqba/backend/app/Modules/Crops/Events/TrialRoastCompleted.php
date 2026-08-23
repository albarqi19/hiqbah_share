<?php

namespace App\Modules\Crops\Events;

use App\Modules\Crops\Models\TrialRoast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TrialRoastCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public TrialRoast $trialRoast) {}
}
