<?php

namespace App\Modules\Inventory\Listeners;

use App\Modules\Branch\Events\CalibrationCompleted;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;

class OnCalibrationCompleted
{
    public function handle(CalibrationCompleted $event): void
    {
        $session = $event->session;

        if (!$session->total_waste_grams || $session->total_waste_grams <= 0) return;

        try {
            app(InventoryService::class)->recordMovement(
                branchId: $session->branch_id,
                cropId: $session->crop_id,
                itemType: ItemType::Bar,
                movementType: MovementType::CalibrationWaste,
                quantity: (float) $session->total_waste_grams,
                staffId: $session->barista_id,
                referenceType: get_class($session),
                referenceId: $session->id,
                notes: "Calibration waste: {$session->total_shots} shots",
            );
        } catch (\Exception) {
            // If bar inventory doesn't exist yet, silently skip
        }
    }
}
