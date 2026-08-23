<?php

namespace App\Modules\Branch\Events;

use App\Modules\Branch\Models\CalibrationSession;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CalibrationCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(public CalibrationSession $session) {}
}
