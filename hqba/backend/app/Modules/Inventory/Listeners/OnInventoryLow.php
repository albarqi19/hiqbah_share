<?php

namespace App\Modules\Inventory\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Inventory\Events\InventoryLow;

class OnInventoryLow
{
    public function handle(InventoryLow $event): void
    {
        $item = $event->inventoryItem;
        $item->load(['branch', 'crop']);

        $type = $item->item_type->labelEn();
        $typeAr = $item->item_type->label();
        $cropName = $item->crop?->serial_number ?? "Crop #{$item->crop_id}";

        app(NotificationService::class)->sendToAdmins(
            'inventory_low',
            "Low stock alert: {$type} - {$cropName} ({$item->quantity} {$item->unit})",
            "تنبيه مخزون منخفض: {$typeAr} - {$cropName} ({$item->quantity} {$item->unit})",
            "Current: {$item->quantity} {$item->unit}, Threshold: {$item->min_threshold} {$item->unit}",
            "الحالي: {$item->quantity} {$item->unit}، الحد الأدنى: {$item->min_threshold} {$item->unit}",
            '/inventory/alerts',
            get_class($item),
            $item->id,
        );
    }
}
