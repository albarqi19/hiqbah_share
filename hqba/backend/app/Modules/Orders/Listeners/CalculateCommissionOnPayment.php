<?php

namespace App\Modules\Orders\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Orders\Events\OrderPaid;
use App\Modules\Sales\Services\CommissionService;

class CalculateCommissionOnPayment
{
    public function __construct(
        private CommissionService $commissionService,
        private NotificationService $notificationService,
    ) {}

    public function handle(OrderPaid $event): void
    {
        $order = $event->order->load('customer');
        $commission = $this->commissionService->calculateCommission($order);

        if ($commission) {
            // Notify sales rep
            $this->notificationService->send(
                $commission->sales_rep_id,
                'commission_created',
                "Commission earned: SAR {$commission->commission_amount} for order {$order->order_number}",
                "مبروك! عمولتك " . number_format((float) $commission->commission_amount, 2) . " ر.س للطلب {$order->order_number} جاهزة",
                null,
                null,
                "/commissions/{$commission->id}",
                get_class($commission),
                $commission->id,
            );
        }
    }
}
