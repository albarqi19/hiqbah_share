<?php

namespace App\Modules\Reporting\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Quality\Services\WasteService;
use App\Modules\Reporting\Services\CropReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    public function __construct(
        protected CropReportService $cropReportService,
        protected WasteService $wasteService,
    ) {}

    public function cropReport(int $id): JsonResponse
    {
        return $this->success($this->cropReportService->getCropReport($id));
    }

    public function wasteReport(Request $request): JsonResponse
    {
        $summary = $this->wasteService->getSummary();
        return $this->success($summary);
    }
}
