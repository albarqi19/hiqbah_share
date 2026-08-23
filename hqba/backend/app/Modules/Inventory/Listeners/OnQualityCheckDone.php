<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Models\Branch;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Production\Events\QualityCheckDone;

class OnQualityCheckDone
{
    public function handle(QualityCheckDone $event): void
    {
        $qc = $event->qualityCheck;
        $batch = $qc->roastBatch;
        $roastery = Branch::where('type', 'roastery')->first();

        if (!$roastery || !$qc->sample_weight_grams) return;

        app(InventoryService::class)->recordMovement(
            branchId: $roastery->id,
            cropId: $batch->crop_id,
            itemType: ItemType::Roasted,
            movementType: MovementType::QcWaste,
            quantity: (float) $qc->sample_weight_grams / 1000,
            staffId: $qc->inspector_id,
            referenceType: get_class($qc),
            referenceId: $qc->id,
            notes: "QC sample waste: {$batch->batch_number}",
        );
    }
}
