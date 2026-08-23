<?php

namespace App\Modules\Orders\Policies;

use App\Core\Models\User;
use App\Modules\Orders\Models\Order;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['orders.view', 'orders.create', 'orders.review', 'orders.approve']);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->hasAnyPermission(['orders.view', 'orders.create', 'orders.review', 'orders.approve']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['orders.create', 'orders.review']);
    }

    public function transition(User $user, Order $order): bool
    {
        $status = $order->status->value;

        return match ($status) {
            'draft', 'sales_review', 'sales_confirm' => $user->hasAnyPermission(['orders.review', 'orders.create', 'orders.approve']),
            'inventory_check' => $user->hasAnyPermission(['orders.approve', 'inventory.view']),
            'accounting' => $user->hasAnyPermission(['orders.approve', 'purchase_orders.approve']),
            'pending_payment' => $user->hasAnyPermission(['orders.approve']),
            'allocated', 'in_production', 'packing' => $user->hasAnyPermission(['orders.approve', 'orders.ship', 'production.start']),
            'shipped' => $user->hasAnyPermission(['orders.close', 'orders.approve']),
            default => $user->hasAnyPermission(['orders.approve']),
        };
    }

    public function cancel(User $user, Order $order): bool
    {
        return $user->hasAnyPermission(['orders.approve', 'orders.review']);
    }

    public function confirmPayment(User $user, Order $order): bool
    {
        return $user->hasAnyPermission(['orders.approve']);
    }
}
