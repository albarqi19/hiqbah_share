<?php

namespace App\Modules\Crops\Events;

use App\Modules\Crops\Models\Crop;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CropStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Crop $crop,
        public string $oldStatus,
        public string $newStatus,
    ) {}
}
