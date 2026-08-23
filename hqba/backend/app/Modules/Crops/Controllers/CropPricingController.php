<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Requests\StorePricingRequest;
use App\Modules\Crops\Resources\CropPricingResource;
use App\Modules\Crops\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CropPricingController extends ApiController
{
    public function __construct(
        protected PricingService $pricingService,
    ) {}

    public function show(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $pricing = $this->pricingService->getForCrop($crop);

        if (! $pricing) {
            return $this->notFound('Pricing not set for this crop');
        }

        $pricing->load('crop');

        return $this->success(new CropPricingResource($pricing));
    }

    public function store(string $crop, StorePricingRequest $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $pricing = $this->pricingService->calculate($crop, $request->validated());

        return $this->created(new CropPricingResource($pricing));
    }

    public function update(string $crop, Request $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $pricing = $crop->pricing;

        if (! $pricing) {
            return $this->notFound('Pricing not set for this crop');
        }

        $pricing = $this->pricingService->update($pricing, $request->all());

        return $this->success(new CropPricingResource($pricing));
    }

    public function approve(string $crop, Request $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $pricing = $crop->pricing;

        if (! $pricing) {
            return $this->notFound('Pricing not set for this crop');
        }

        $request->validate([
            'approved_by' => ['required', 'exists:users,id'],
        ]);

        $pricing = $this->pricingService->approve($pricing, $request->input('approved_by'));

        return $this->success(new CropPricingResource($pricing));
    }
}
