<?php

namespace App\Modules\Orders\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Requests\CreateOrderRequest;
use App\Modules\Orders\Resources\OrderResource;
use App\Modules\Orders\Services\OrderService;
use App\Modules\Pricing\Services\DiscountService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends ApiController
{
    public function __construct(
        protected OrderService $service,
        protected DiscountService $discountService,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        return $this->success(OrderResource::collection($this->service->list()));
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $this->authorize('create', Order::class);
        $data = $request->except('items');
        $data['created_by'] = auth()->id();
        $order = $this->service->create($data, $request->input('items'));

        return $this->created(new OrderResource($order));
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);
        $order->load(['customer.salesRep', 'items.crop', 'creator', 'salesRep', 'statusHistory.user', 'shipments.items.orderItem', 'allocations']);

        return $this->success(new OrderResource($order));
    }

    public function transition(Order $order, Request $request): JsonResponse
    {
        $this->authorize('transition', $order);

        $validStatuses = array_map(fn ($s) => $s->value, OrderStatus::cases());
        $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', $validStatuses)],
            'notes' => ['nullable', 'string'],
        ]);

        $order = $this->service->transition(
            $order, $request->input('status'), auth()->id(), $request->input('notes')
        );

        return $this->success(new OrderResource($order));
    }

    public function inventoryCheck(Order $order): JsonResponse
    {
        $this->authorize('view', $order);
        $order->load('items');

        return $this->success($this->service->inventoryCheck($order));
    }

    public function confirmPayment(Order $order, Request $request): JsonResponse
    {
        $this->authorize('confirmPayment', $order);
        $request->validate(['payment_method' => ['required', 'string', 'in:bank_transfer,cash,check,credit_card']]);
        $order = $this->service->confirmPayment($order, auth()->id(), $request->input('payment_method'));

        return $this->success(new OrderResource($order));
    }

    public function cancel(Order $order, Request $request): JsonResponse
    {
        $this->authorize('cancel', $order);
        $request->validate(['reason' => ['required', 'string']]);
        $order = $this->service->cancel($order, auth()->id(), $request->input('reason'));

        return $this->success(new OrderResource($order));
    }

    // ── New Endpoints ──

    public function generateQuote(Order $order): JsonResponse
    {
        $order = $this->service->generateQuote($order, auth()->id());

        return $this->success(new OrderResource($order), 'تم إنشاء عرض السعر');
    }

    public function quotePdf(Order $order): \Illuminate\Http\Response
    {
        $pdf = $this->service->getQuotePdf($order);

        return $pdf->download("quote-{$order->quote_number}.pdf");
    }

    public function allocateStock(Order $order): JsonResponse
    {
        $order = $this->service->allocateStock($order, auth()->id());

        return $this->success(new OrderResource($order), 'تم تخصيص المخزون');
    }

    public function releaseAllocations(Order $order): JsonResponse
    {
        $this->service->releaseAllocations($order);

        return $this->success(null, 'تم تحرير المخزون المخصص');
    }

    public function allocations(Order $order): JsonResponse
    {
        $allocations = $order->allocations()
            ->with(['orderItem', 'inventoryItem.crop'])
            ->get();

        return $this->success($allocations);
    }

    public function applyDiscount(Order $order, Request $request): JsonResponse
    {
        $request->validate([
            'discount_id' => ['required_without:code', 'nullable', 'exists:discounts,id'],
            'code' => ['required_without:discount_id', 'nullable', 'string'],
        ]);

        if ($request->input('code')) {
            $order = $this->discountService->applyDiscountByCode($order, $request->input('code'));
        } else {
            $discount = \App\Modules\Pricing\Models\Discount::findOrFail($request->input('discount_id'));
            $order = $this->discountService->applyDiscount($order, $discount);
        }

        return $this->success(new OrderResource($order->fresh()), 'تم تطبيق الخصم');
    }

    public function overduePayments(): JsonResponse
    {
        return $this->success($this->service->overduePayments());
    }

    public function packingSlip(Order $order): \Illuminate\Http\Response
    {
        $order->load(['customer', 'items.crop', 'creator']);
        $pdf = Pdf::loadView('pdfs.packing-slip', compact('order'));

        return $pdf->download("packing-slip-{$order->order_number}.pdf");
    }

    public function shippingLabel(Order $order): \Illuminate\Http\Response
    {
        $order->load(['customer']);
        $pdf = Pdf::loadView('pdfs.shipping-label', compact('order'));

        return $pdf->download("shipping-label-{$order->order_number}.pdf");
    }
}
