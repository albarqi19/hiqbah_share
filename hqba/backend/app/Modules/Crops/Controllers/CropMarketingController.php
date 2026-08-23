<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Requests\StoreMarketingRequest;
use App\Modules\Crops\Resources\CropMarketingResource;
use App\Modules\Crops\Services\LabelService;
use App\Modules\Crops\Services\MarketingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CropMarketingController extends ApiController
{
    public function __construct(
        protected MarketingService $marketingService,
    ) {}

    public function show(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $marketing = $this->marketingService->getForCrop($crop);

        if (! $marketing) {
            return $this->notFound('Marketing not set for this crop');
        }

        $marketing->load('crop');

        return $this->success(new CropMarketingResource($marketing));
    }

    public function store(string $crop, StoreMarketingRequest $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $marketing = $this->marketingService->create($crop, $request->validated());

        return $this->created(new CropMarketingResource($marketing));
    }

    public function update(string $crop, Request $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $marketing = $crop->marketing;

        if (! $marketing) {
            return $this->notFound('Marketing not set for this crop');
        }

        $marketing = $this->marketingService->update($marketing, $request->all());

        return $this->success(new CropMarketingResource($marketing));
    }

    public function approve(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);

        try {
            $marketing = $this->marketingService->approve($crop);
            return $this->success(new CropMarketingResource($marketing->load('crop')));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function generateLabel(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $labelService = app(LabelService::class);
        $url = $labelService->generateLabel($crop);

        return $this->success(['label_url' => $url]);
    }

    public function exportText(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $marketing = $crop->marketing;

        if (! $marketing) {
            return $this->notFound('No marketing data');
        }

        $text = "=== {$marketing->product_name} ===\n";
        $text .= "{$marketing->product_name_ar}\n\n";
        $text .= "--- Description ---\n{$marketing->marketing_description}\n\n";
        $text .= "--- الوصف ---\n{$marketing->marketing_description_ar}\n\n";
        $text .= "--- Flavor Notes ---\n{$marketing->flavor_display}\n\n";
        $text .= "--- Social Media (EN) ---\n{$marketing->social_media_text}\n\n";
        $text .= "--- Social Media (AR) ---\n{$marketing->social_media_text_ar}\n";

        return $this->success(['text' => $text, 'filename' => "marketing-{$crop->serial_number}.txt"]);
    }
}
