<?php

namespace App\Modules\Orders\Services;

use App\Core\Services\NotificationService;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Enums\MovementType;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\Orders\Enums\AllocationStatus;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\PaymentTerms;
use App\Modules\Orders\Enums\ShipmentStatus;
use App\Modules\Orders\Events\OrderPaid;
use App\Modules\Orders\Events\StockAllocated;
use App\Modules\Orders\Events\StockReleased;
use App\Modules\Orders\Events\ShipmentDelivered;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\OrderStatusHistory;
use App\Modules\Orders\Models\Shipment;
use App\Modules\Orders\Models\ShipmentItem;
use App\Modules\Orders\Models\StockAllocation;
use App\Modules\Pricing\Services\PricingService;
use App\Modules\Sales\Services\CommissionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class OrderService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected PricingService $pricingService,
    ) {}

    // ══════════════════════════════════════════
    // LIST & QUERY
    // ══════════════════════════════════════════

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Order::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::exact('sales_rep_id'),
                AllowedFilter::exact('payment_status'),
                'order_number',
            ])
            ->allowedSorts(['created_at', 'total', 'status', 'payment_due_date'])
            ->allowedIncludes(['customer', 'items', 'creator', 'salesRep'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function overduePayments(): LengthAwarePaginator
    {
        return Order::overduePayments()
            ->with(['customer', 'salesRep'])
            ->orderBy('payment_due_date')
            ->paginate(request('per_page', 25));
    }

    // ══════════════════════════════════════════
    // CREATE ORDER (Enhanced)
    // ══════════════════════════════════════════

    public function create(array $data, array $items): Order
    {
        $data['order_number'] = Order::generateOrderNumber();
        $data['status'] = OrderStatus::Draft->value;

        // Auto-inherit from customer
        $customer = \App\Modules\Orders\Models\Customer::find($data['customer_id']);
        if ($customer) {
            $data['sales_rep_id'] = $data['sales_rep_id'] ?? $customer->sales_rep_id;
            $data['price_list_id'] = $data['price_list_id'] ?? $customer->price_list_id;
            $data['payment_terms'] = $data['payment_terms'] ?? $customer->payment_terms;
        }

        $order = Order::create($data);

        foreach ($items as $item) {
            // Auto-resolve price from price list if unit_price not provided
            if (empty($item['unit_price']) && $customer) {
                $resolvedPrice = $this->pricingService->resolvePrice(
                    $customer->id,
                    $item['crop_id'],
                    $item['item_type'],
                );
                $item['unit_price'] = $resolvedPrice ?? 0;
            }

            $item['order_id'] = $order->id;
            $item['total_price'] = $item['quantity'] * $item['unit_price'];
            $item['final_price'] = $item['total_price'];
            OrderItem::create($item);
        }

        $order->calculateTotals();
        $order->save();

        $this->recordStatusChange($order, null, OrderStatus::Draft->value, $data['created_by']);

        return $order->load(['customer', 'items.crop', 'creator', 'salesRep']);
    }

    // ══════════════════════════════════════════
    // STATE TRANSITIONS
    // ══════════════════════════════════════════

    public function transition(Order $order, string $newStatus, int $userId, ?string $notes = null, array $extraData = []): Order
    {
        $currentStatus = $order->status;
        $allowed = $currentStatus->allowedTransitions();
        $newStatusEnum = OrderStatus::from($newStatus);

        if (! in_array($newStatusEnum, $allowed)) {
            throw ValidationException::withMessages([
                'status' => ["لا يمكن الانتقال من {$currentStatus->label()} إلى {$newStatusEnum->label()}"],
            ]);
        }

        // ── Pre-transition validations ──

        // Inventory check before accounting
        if ($currentStatus === OrderStatus::InventoryCheck && $newStatusEnum === OrderStatus::Accounting) {
            $order->load('items');
            $checkResults = $this->inventoryCheck($order);
            $allAvailable = collect($checkResults)->every(fn ($r) => $r['available'] === true);

            if (! $allAvailable) {
                throw ValidationException::withMessages([
                    'inventory' => ['لا يمكن التقدم: المخزون غير كافٍ لبعض البنود'],
                ]);
            }
        }

        $updateData = array_merge(['status' => $newStatus], $extraData);

        // ── Post-transition side effects ──

        if ($newStatusEnum === OrderStatus::Shipped) {
            $updateData['shipped_at'] = now();
        }

        if ($newStatusEnum === OrderStatus::Delivered) {
            $updateData['delivered_at'] = now();
        }

        $order->update($updateData);
        $this->recordStatusChange($order, $currentStatus->value, $newStatus, $userId, $notes);

        // Deduct inventory when shipped (actual Sale movement)
        if ($newStatusEnum === OrderStatus::Shipped) {
            $this->deductInventoryOnShipment($order, $userId);
        }

        // Notify admins
        app(NotificationService::class)->sendToAdmins(
            'order_status_changed',
            "Order {$order->order_number} → {$newStatusEnum->labelEn()}",
            "الطلب {$order->order_number} → {$newStatusEnum->label()}",
            null, null,
            "/orders/{$order->id}",
            get_class($order),
            $order->id,
        );

        return $order->fresh()->load(['customer', 'items.crop', 'creator', 'salesRep', 'statusHistory']);
    }

    // ══════════════════════════════════════════
    // PAYMENT CONFIRMATION (Enhanced)
    // ══════════════════════════════════════════

    public function confirmPayment(Order $order, int $userId, string $paymentMethod): Order
    {
        $extraData = [
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ];

        // Calculate payment due date for credit terms
        if ($order->payment_terms) {
            $terms = PaymentTerms::tryFrom($order->payment_terms);
            if ($terms && $terms->dueDays() > 0) {
                $extraData['payment_due_date'] = now()->addDays($terms->dueDays())->toDateString();
                // Credit customers: mark as partial until due date
                $extraData['payment_status'] = 'paid';
            }
        }

        $order = $this->transition($order, 'allocated', $userId, "Payment confirmed: {$paymentMethod}", $extraData);

        // Fire OrderPaid event → triggers commission calculation
        OrderPaid::dispatch($order);

        return $order;
    }

    // ══════════════════════════════════════════
    // STOCK ALLOCATION
    // ══════════════════════════════════════════

    public function allocateStock(Order $order, int $userId): Order
    {
        if ($order->status !== OrderStatus::Allocated && $order->status !== OrderStatus::InProduction) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن تخصيص المخزون في حالة ' . $order->status->label()],
            ]);
        }

        $order->load('items');

        return DB::transaction(function () use ($order, $userId) {
            foreach ($order->items as $item) {
                if ($item->isFullyAllocated()) {
                    continue;
                }

                $remaining = $item->remainingToAllocate();
                $itemType = ItemType::from($item->item_type);

                // Find inventory item with pessimistic lock
                $inventoryItem = InventoryItem::lockForUpdate()
                    ->where('branch_id', 1) // roastery
                    ->where('crop_id', $item->crop_id)
                    ->where('item_type', $itemType)
                    ->first();

                if (! $inventoryItem || (float) $inventoryItem->quantity < $remaining) {
                    throw ValidationException::withMessages([
                        'inventory' => ["المخزون غير كافٍ للمنتج: {$item->product_name}"],
                    ]);
                }

                // Create allocation record (soft reservation)
                StockAllocation::create([
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity_allocated' => $remaining,
                    'status' => AllocationStatus::Reserved,
                    'allocated_by' => $userId,
                ]);

                $item->update(['quantity_allocated' => $item->quantity]);
            }

            StockAllocated::dispatch($order);

            return $order->fresh()->load(['items', 'allocations']);
        });
    }

    public function releaseAllocations(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->allocations()
                ->where('status', AllocationStatus::Reserved)
                ->update([
                    'status' => AllocationStatus::Released,
                    'released_at' => now(),
                ]);

            // Reset allocation counts on items
            $order->items()->update(['quantity_allocated' => 0]);

            StockReleased::dispatch($order);
        });
    }

    // ══════════════════════════════════════════
    // SHIPMENT MANAGEMENT
    // ══════════════════════════════════════════

    public function createShipment(Order $order, array $shipmentItems, int $userId, array $shippingData = []): Shipment
    {
        if (! in_array($order->status, [OrderStatus::Packing, OrderStatus::PartiallyShipped])) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إنشاء شحنة في حالة ' . $order->status->label()],
            ]);
        }

        return DB::transaction(function () use ($order, $shipmentItems, $userId, $shippingData) {
            // Validate quantities
            foreach ($shipmentItems as $si) {
                $orderItem = OrderItem::findOrFail($si['order_item_id']);
                $remaining = $orderItem->remainingToShip();

                if ($si['quantity_shipped'] > $remaining) {
                    throw ValidationException::withMessages([
                        'items' => ["الكمية المشحونة ({$si['quantity_shipped']}) أكبر من المتبقي ({$remaining}) للمنتج: {$orderItem->product_name}"],
                    ]);
                }
            }

            $shipment = Shipment::create([
                'shipment_number' => Shipment::generateShipmentNumber(),
                'order_id' => $order->id,
                'status' => ShipmentStatus::Pending,
                'shipping_address' => $shippingData['shipping_address'] ?? $order->shipping_address,
                'shipping_city' => $shippingData['shipping_city'] ?? $order->shipping_city,
                'carrier' => $shippingData['carrier'] ?? null,
                'tracking_number' => $shippingData['tracking_number'] ?? null,
                'notes' => $shippingData['notes'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($shipmentItems as $si) {
                ShipmentItem::create([
                    'shipment_id' => $shipment->id,
                    'order_item_id' => $si['order_item_id'],
                    'quantity_shipped' => $si['quantity_shipped'],
                ]);

                // Update denormalized counter
                $orderItem = OrderItem::find($si['order_item_id']);
                $orderItem->increment('quantity_shipped', $si['quantity_shipped']);
            }

            // Auto-determine order shipping status
            $order->refresh()->load('items');
            if ($order->isFullyShipped()) {
                $this->transition($order, OrderStatus::Shipped->value, $userId, "شحنة كاملة: {$shipment->shipment_number}");
            } elseif ($order->isPartiallyShipped()) {
                if ($order->status !== OrderStatus::PartiallyShipped) {
                    $this->transition($order, OrderStatus::PartiallyShipped->value, $userId, "شحنة جزئية: {$shipment->shipment_number}");
                }
            }

            return $shipment->load('items.orderItem');
        });
    }

    public function confirmDelivery(Shipment $shipment, int $userId, ?string $confirmation = null): Shipment
    {
        $shipment->update([
            'status' => ShipmentStatus::Delivered,
            'delivered_at' => now(),
            'delivery_confirmation' => $confirmation,
        ]);

        ShipmentDelivered::dispatch($shipment);

        // Check if ALL shipments for this order are delivered
        $order = $shipment->order;
        $allDelivered = $order->shipments()->where('status', '!=', ShipmentStatus::Delivered)->doesntExist();

        if ($allDelivered && $order->status === OrderStatus::Shipped) {
            $this->transition($order, OrderStatus::Delivered->value, $userId, 'تم تأكيد تسليم جميع الشحنات');
        }

        return $shipment->fresh()->load('items.orderItem');
    }

    // ══════════════════════════════════════════
    // QUOTE GENERATION
    // ══════════════════════════════════════════

    public function generateQuote(Order $order, int $userId): Order
    {
        if (! $order->quote_number) {
            $order->update([
                'quote_number' => Order::generateQuoteNumber(),
                'quote_generated_at' => now(),
            ]);
        }

        return $order->fresh();
    }

    public function getQuotePdf(Order $order): \Barryvdh\DomPDF\PDF
    {
        $order->load(['customer', 'items.crop', 'creator', 'salesRep']);

        return Pdf::loadView('pdfs.quote', compact('order'));
    }

    // ══════════════════════════════════════════
    // INVENTORY CHECK
    // ══════════════════════════════════════════

    public function inventoryCheck(Order $order): array
    {
        $results = [];
        foreach ($order->items as $item) {
            $itemType = ItemType::from($item->item_type);
            $available = $this->inventoryService->checkAvailability(
                1, // roastery branch_id
                $item->crop_id,
                $itemType,
                $item->quantity,
            );
            $results[] = [
                'item_id' => $item->id,
                'product_name' => $item->product_name,
                'requested' => $item->quantity,
                'available' => $available,
            ];
        }

        return $results;
    }

    // ══════════════════════════════════════════
    // CANCELLATION (Enhanced)
    // ══════════════════════════════════════════

    public function cancel(Order $order, int $userId, string $reason): Order
    {
        if (! $order->status->isCancellable()) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن إلغاء الطلب في حالة ' . $order->status->label()],
            ]);
        }

        // Release any stock allocations
        if ($order->allocations()->where('status', AllocationStatus::Reserved)->exists()) {
            $this->releaseAllocations($order);
        }

        // Reverse commission if payment was confirmed
        if ($order->payment_status === 'paid') {
            app(CommissionService::class)->reverseCommission($order, $userId);
        }

        $order->update(['status' => OrderStatus::Cancelled]);
        $this->recordStatusChange($order, $order->getOriginal('status'), OrderStatus::Cancelled->value, $userId, $reason);

        app(NotificationService::class)->sendToAdmins(
            'order_cancelled',
            "Order {$order->order_number} cancelled",
            "تم إلغاء الطلب {$order->order_number}",
            $reason, $reason,
            "/orders/{$order->id}",
            get_class($order),
            $order->id,
        );

        return $order->fresh()->load(['customer', 'items.crop', 'creator', 'statusHistory']);
    }

    // ══════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════

    protected function recordStatusChange(Order $order, ?string $from, string $to, int $userId, ?string $notes = null): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $userId,
            'notes' => $notes,
            'created_at' => now(),
        ]);
    }

    private function deductInventoryOnShipment(Order $order, int $userId): void
    {
        $order->load('items');
        foreach ($order->items as $item) {
            $this->inventoryService->recordMovement(
                1, // roastery branch_id
                $item->crop_id,
                ItemType::from($item->item_type),
                MovementType::Sale,
                $item->quantity,
                $userId,
                get_class($order),
                $order->id,
                (float) $item->unit_price,
                "Order {$order->order_number}",
            );
        }
    }
}
