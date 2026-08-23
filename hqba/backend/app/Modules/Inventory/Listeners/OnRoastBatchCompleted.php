<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Models\Branch;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Production\Events\RoastBatchCompleted;

class OnRoastBatchCompleted
{
    public function handle(RoastBatchCompleted $event): void
    {
        $batch = $event->roastBatch;
        $roastery = Branch::where('type', 'roastery')->first();

        if (!$roastery || !$batch->roasted_weight_kg) {
            return;
        }

        $inventory = app(InventoryService::class);

        // Add roasted coffee to inventory
        $inventory->recordMovement(
            branchId: $roastery->id,
            cropId: $batch->crop_id,
            itemType: ItemType::Roasted,
            movementType: MovementType::RoastingIn,
            quantity: (float) $batch->roasted_weight_kg,
            staffId: $batch->roaster_id,
            referenceType: get_class($batch),
            referenceId: $batch->id,
            notes: "Roasted coffee from batch: {$batch->batch_number}",
        );

        // Record roast loss as inventory movement
        if ($batch->roast_loss_kg && $batch->roast_loss_kg > 0) {
            $inventory->recordMovement(
                branchId: $roastery->id,
                cropId: $batch->crop_id,
                itemType: ItemType::Green,
                movementType: MovementType::RoastLoss,
                quantity: (float) $batch->roast_loss_kg,
                staffId: $batch->roaster_id,
                referenceType: get_class($batch),
                referenceId: $batch->id,
                notes: "Roast loss ({$batch->roast_loss_percent}%): {$batch->batch_number}",
            );
        }
    }
}
