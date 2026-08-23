<?php

namespace App\Modules\Pricing\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Pricing\Requests\SimulateMarginRequest;
use App\Modules\Pricing\Resources\PriceChangeLogResource;
use App\Modules\Pricing\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingController extends ApiController
{
    public function __construct(private PricingService $service) {}

    public function resolve(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'crop_id' => ['required', 'exists:crops,id'],
            'item_type' => ['required', 'string'],
        ]);

        $price = $this->service->resolvePrice(
            $request->input('customer_id'),
            $request->input('crop_id'),
            $request->input('item_type'),
        );

        return $this->success([
            'customer_id' => (int) $request->input('customer_id'),
            'crop_id' => (int) $request->input('crop_id'),
            'item_type' => $request->input('item_type'),
            'unit_price' => $price,
        ]);
    }

    public function resolveBatch(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.crop_id' => ['required', 'exists:crops,id'],
            'items.*.item_type' => ['required', 'string'],
        ]);

        $prices = $this->service->resolvePricesForOrder(
            $request->input('customer_id'),
            $request->input('items'),
        );

        return $this->success($prices);
    }

    public function simulateMargin(SimulateMarginRequest $request): JsonResponse
    {
        $result = $this->service->simulateMarginImpact(
            $request->validated('crop_id'),
            $request->validated('item_type'),
            $request->validated('new_price'),
        );

        return $this->success($result);
    }

    public function changeLogs(): JsonResponse
    {
        $logs = $this->service->listChangeLogs();

        return $this->success(PriceChangeLogResource::collection($logs));
    }
}
