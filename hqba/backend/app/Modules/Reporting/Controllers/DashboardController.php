<?php

namespace App\Modules\Reporting\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Reporting\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function __construct(protected DashboardService $dashboardService) {}

    public function admin(): JsonResponse
    {
        return $this->success($this->dashboardService->getAdminDashboard());
    }

    public function quality(): JsonResponse
    {
        return $this->success($this->dashboardService->getQualityDashboard());
    }
}
