<?php

namespace App\Modules\Quality\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Quality\Resources\WasteRecordResource;
use App\Modules\Quality\Services\WasteService;
use Illuminate\Http\JsonResponse;

class WasteRecordController extends ApiController
{
    public function __construct(
        protected WasteService $wasteService,
    ) {}

    public function index(): JsonResponse
    {
        $records = $this->wasteService->list();

        return $this->success(WasteRecordResource::collection($records));
    }

    public function summary(): JsonResponse
    {
        $summary = $this->wasteService->getSummary();

        return $this->success($summary);
    }

    public function byCrop(int $cropId): JsonResponse
    {
        $data = $this->wasteService->getWasteByCrop($cropId);

        return $this->success($data);
    }

    public function warnings(): JsonResponse
    {
        $service = app(\App\Modules\Quality\Services\EarlyWarningService::class);
        return $this->success($service->getWarnings());
    }
}
