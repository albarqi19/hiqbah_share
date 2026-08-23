<?php

namespace App\Modules\Orders\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\Shipment;
use App\Modules\Orders\Resources\ShipmentResource;
use App\Modules\Orders\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentController extends ApiController
{
    public function __construct(protected OrderService $service) {}

    public function index(Order $order): JsonResponse
    {
        $shipments = $order->shipments()
            ->with(['items.orderItem', 'createdBy'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success(ShipmentResource::collection($shipments));
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'exists:order_items,id'],
            'items.*.quantity_shipped' => ['required', 'integer', 'min:1'],
            'carrier' => ['nullable', 'string', 'max:255'],
            'tracking_number' => ['nullable', 'string', 'max:255'],
            'shipping_address' => ['nullable', 'string'],
            'shipping_city' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $shipment = $this->service->createShipment(
            $order,
            $request->input('items'),
            auth()->id(),
            $request->only(['carrier', 'tracking_number', 'shipping_address', 'shipping_city', 'notes']),
        );

        return $this->created(new ShipmentResource($shipment));
    }

    public function confirmDelivery(Request $request, Shipment $shipment): JsonResponse
    {
        $request->validate([
            'delivery_confirmation' => ['nullable', 'string'],
        ]);

        $shipment = $this->service->confirmDelivery(
            $shipment,
            auth()->id(),
            $request->input('delivery_confirmation'),
        );

        return $this->success(new ShipmentResource($shipment), 'تم تأكيد التسليم');
    }
}
