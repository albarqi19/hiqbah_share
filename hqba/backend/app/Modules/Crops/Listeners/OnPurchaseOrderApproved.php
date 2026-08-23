<?php

namespace App\Modules\Crops\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Crops\Models\Crop;
use App\Modules\Procurement\Events\PurchaseOrderApproved;

class OnPurchaseOrderApproved
{
    public function handle(PurchaseOrderApproved $event): void
    {
        $po = $event->purchaseOrder;

        // Generate country code from origin_country (first 3 chars uppercase)
        $countryCode = strtoupper(substr($po->origin_country, 0, 3));

        $crop = Crop::create([
            'serial_number' => Crop::generateSerialNumber($countryCode),
            'purchase_order_id' => $po->id,
            'supplier_id' => $po->supplier_id,
            'name' => $po->region . ' ' . $po->origin_country,
            'name_ar' => $po->region . ' ' . $po->origin_country,
            'origin_country' => $po->origin_country,
            'region' => $po->region,
            'farm' => $po->farm,
            'process' => $po->process,
            'variety' => $po->variety,
            'altitude' => $po->altitude,
            'lot_number' => $po->po_number,
            'status' => 'ordered',
            'total_green_weight' => $po->quantity_kg,
            'remaining_green_weight' => $po->quantity_kg,
        ]);

        app(NotificationService::class)->sendToAdmins(
            'po_approved',
            "PO {$po->po_number} Approved",
            "تم اعتماد أمر الشراء {$po->po_number}",
            "Crop {$crop->serial_number} created automatically",
            "تم إنشاء المحصول {$crop->serial_number} تلقائياً",
            "/crops/{$crop->id}",
            get_class($crop),
            $crop->id,
        );
    }
}
