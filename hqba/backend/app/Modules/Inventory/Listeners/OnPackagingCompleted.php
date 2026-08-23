<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Models\Branch;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Production\Events\PackagingCompleted;

class OnPackagingCompleted
{
    public function handle(PackagingCompleted $event): void
    {
        $lot = $event->packagingLot;
        $roastery = Branch::where('type', 'roastery')->first();
        if (!$roastery) return;

        $inventory = app(InventoryService::class);

        // Deduct roasted coffee
        $inventory->recordMovement(
            $roastery->id, $lot->crop_id, ItemType::Roasted, MovementType::PackagingOut,
            (float) $lot->roasted_weight_used_kg, $lot->packed_by,
            get_class($lot), $lot->id, null,
            "Roasted to packaging: {$lot->lot_number}",
        );

        // Add finished bags
        $itemType = ItemType::from($lot->itemType());
        $inventory->recordMovement(
            $roastery->id, $lot->crop_id, $itemType, MovementType::PackagingIn,
            (float) $lot->bags_count, $lot->packed_by,
            get_class($lot), $lot->id, null,
            "Packaged: {$lot->bags_count} × {$lot->package_size}g bags ({$lot->lot_number})",
        );
    }
}
