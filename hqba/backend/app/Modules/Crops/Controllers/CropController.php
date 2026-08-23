<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Requests\StoreCropRequest;
use App\Modules\Crops\Requests\UpdateCropRequest;
use App\Modules\Crops\Resources\CropResource;
use App\Modules\Crops\Services\CropService;
use Illuminate\Http\JsonResponse;

class CropController extends ApiController
{
    public function __construct(
        protected CropService $cropService,
    ) {}

    public function index(): JsonResponse
    {
        $crops = $this->cropService->list();

        return $this->success(CropResource::collection($crops));
    }

    public function store(StoreCropRequest $request): JsonResponse
    {
        $crop = $this->cropService->create($request->validated());

        return $this->created(new CropResource($crop));
    }

    public function show(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $crop->load(['supplier', 'purchaseOrder', 'pricing', 'marketing']);
        $crop->loadCount(['greenCoffeeLots', 'trialRoasts', 'cuppingSessions', 'recipes', 'wasteRecords']);

        return $this->success(new CropResource($crop));
    }

    public function update(UpdateCropRequest $request, string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $crop = $this->cropService->update($crop, $request->validated());

        return $this->success(new CropResource($crop));
    }

    public function destroy(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $this->cropService->delete($crop);

        return $this->noContent();
    }

    public function timeline(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $timeline = $this->cropService->getTimeline($crop);

        return $this->success($timeline);
    }

    public function traceability(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $data = $this->cropService->getTraceability($crop);

        return $this->success($data);
    }

    public function qrCode(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);

        // Generate QR data URL pointing to public journey page
        $journeyUrl = config('app.frontend_url', 'http://localhost:5173') . '/crops/' . $crop->id . '/journey';

        $qrCode = new \BaconQrCode\Renderer\Image\SvgImageBackEnd();
        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(300),
            $qrCode
        );
        $writer = new \BaconQrCode\Writer($renderer);
        $svgString = $writer->writeString($journeyUrl);

        return $this->success([
            'url' => $journeyUrl,
            'svg' => $svgString,
            'serial_number' => $crop->serial_number,
        ]);
    }
}
