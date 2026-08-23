<?php

namespace App\Modules\Production\Events;

use App\Modules\Production\Models\RoastQualityCheck;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QualityCheckDone
{
    use Dispatchable, SerializesModels;

    public function __construct(public RoastQualityCheck $qualityCheck) {}
}
