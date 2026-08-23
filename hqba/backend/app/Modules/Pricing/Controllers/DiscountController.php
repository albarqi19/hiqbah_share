<?php

namespace App\Modules\Pricing\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Pricing\Models\Discount;
use App\Modules\Pricing\Requests\CreateDiscountRequest;
use App\Modules\Pricing\Requests\UpdateDiscountRequest;
use App\Modules\Pricing\Resources\DiscountResource;
use App\Modules\Pricing\Services\DiscountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountController extends ApiController
{
    public function __construct(private DiscountService $service) {}

    public function index(): JsonResponse
    {
        $discounts = $this->service->list();

        return $this->success(DiscountResource::collection($discounts));
    }

    public function store(CreateDiscountRequest $request): JsonResponse
    {
        $discount = $this->service->create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return $this->created(new DiscountResource($discount));
    }

    public function show(Discount $discount): JsonResponse
    {
        $discount->load(['customer', 'priceList', 'createdBy']);

        return $this->success(new DiscountResource($discount));
    }

    public function update(UpdateDiscountRequest $request, Discount $discount): JsonResponse
    {
        $discount = $this->service->update($discount, $request->validated());

        return $this->success(new DiscountResource($discount));
    }

    public function deactivate(Discount $discount): JsonResponse
    {
        $discount = $this->service->deactivate($discount);

        return $this->success(new DiscountResource($discount), 'تم تعطيل الخصم');
    }

    public function validateCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'customer_id' => ['nullable', 'exists:customers,id'],
        ]);

        $discount = $this->service->validateCouponCode(
            $request->input('code'),
            $request->input('customer_id'),
        );

        return $this->success(new DiscountResource($discount), 'كود الخصم صالح');
    }
}
