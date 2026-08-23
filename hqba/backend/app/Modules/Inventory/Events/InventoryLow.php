<?php

namespace App\Modules\Inventory\Events;

use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryLow
{
    use Dispatchable, SerializesModels;

    public function __construct(public InventoryItem $inventoryItem) {}
}
