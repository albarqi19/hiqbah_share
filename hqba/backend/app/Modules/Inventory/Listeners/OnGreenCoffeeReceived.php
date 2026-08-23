<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Models\Branch;
use App\Modules\Crops\Events\GreenCoffeeReceived;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Services\InventoryService;

class OnGreenCoffeeReceived
{
    public function handle(GreenCoffeeReceived $event): void
    {
        $lot = $event->greenCoffeeLot;

        // All receiving happens at the roastery
        $roastery = Branch::where('type', 'roastery')->first();
        if (!$roastery) {
            return;
        }

        // Calculate cost per kg from purchase order
        $costPerKg = null;
        if ($lot->purchaseOrder) {
            $po = $lot->purchaseOrder;
            $costPerKg = $po->quantity_kg > 0
                ? (float) $po->total_cost / $po->quantity_kg
                : null;
        }

        app(InventoryService::class)->recordMovement(
            branchId: $roastery->id,
            cropId: $lot->crop_id,
            itemType: ItemType::Green,
            movementType: MovementType::Receiving,
            quantity: (float) $lot->actual_weight,
            staffId: $lot->received_by,
            referenceType: get_class($lot),
            referenceId: $lot->id,
            costPerUnit: $costPerKg,
            notes: "Green coffee received: {$lot->batch_id} ({$lot->bags_count} bags)",
        );
    }
}
