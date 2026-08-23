<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Models\Branch;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Production\Events\RoastBatchStarted;

class OnRoastBatchStarted
{
    public function handle(RoastBatchStarted $event): void
    {
        $batch = $event->roastBatch;
        $roastery = Branch::where('type', 'roastery')->first();

        if (!$roastery) {
            return;
        }

        // Deduct green coffee from inventory
        app(InventoryService::class)->recordMovement(
            branchId: $roastery->id,
            cropId: $batch->crop_id,
            itemType: ItemType::Green,
            movementType: MovementType::RoastingOut,
            quantity: (float) $batch->green_weight_kg,
            staffId: $batch->roaster_id,
            referenceType: get_class($batch),
            referenceId: $batch->id,
            notes: "Green coffee to roasting: {$batch->batch_number}",
        );
    }
}
