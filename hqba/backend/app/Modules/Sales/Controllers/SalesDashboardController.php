<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Controllers\ApiController;
use App\Core\Models\User;
use App\Modules\Sales\Services\CommissionService;
use App\Modules\Sales\Services\SalesRepService;
use Illuminate\Http\JsonResponse;

class SalesDashboardController extends ApiController
{
    public function __construct(
        private SalesRepService $salesRepService,
        private CommissionService $commissionService,
    ) {}

    public function repDashboard(): JsonResponse
    {
        $data = $this->salesRepService->getRepDashboard(auth()->id());

        return $this->success($data);
    }

    public function managerDashboard(): JsonResponse
    {
        $data = $this->salesRepService->getManagerDashboard();

        return $this->success($data);
    }

    public function repPerformance(User $user): JsonResponse
    {
        $dashboard = $this->salesRepService->getRepDashboard($user->id);
        $commissions = $this->commissionService->getRepSummary(
            $user->id,
            request('from'),
            request('to')
        );

        return $this->success([
            ...$dashboard,
            'commissions_detail' => $commissions,
        ]);
    }
}
