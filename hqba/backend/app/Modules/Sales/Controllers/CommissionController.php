<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Sales\Models\Commission;
use App\Modules\Sales\Resources\CommissionResource;
use App\Modules\Sales\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends ApiController
{
    public function __construct(private CommissionService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(CommissionResource::collection($this->service->list()));
    }

    public function show(Commission $commission): JsonResponse
    {
        $commission->load(['order', 'salesRep', 'commissionRule']);

        return $this->success(new CommissionResource($commission));
    }

    public function approve(Commission $commission): JsonResponse
    {
        $commission = $this->service->approve($commission, auth()->id());

        return $this->success(new CommissionResource($commission), 'تم اعتماد العمولة');
    }

    public function reject(Request $request, Commission $commission): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string']]);

        $commission = $this->service->reject($commission, auth()->id(), $request->input('reason'));

        return $this->success(new CommissionResource($commission), 'تم رفض العمولة');
    }

    public function markPaid(Request $request, Commission $commission): JsonResponse
    {
        $commission = $this->service->markPaid(
            $commission,
            auth()->id(),
            $request->input('payment_reference')
        );

        return $this->success(new CommissionResource($commission), 'تم تسجيل دفع العمولة');
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate(['commission_ids' => ['required', 'array', 'min:1']]);

        $commissions = $this->service->bulkApprove($request->input('commission_ids'), auth()->id());

        return $this->success(CommissionResource::collection($commissions), 'تم اعتماد العمولات');
    }

    public function bulkMarkPaid(Request $request): JsonResponse
    {
        $request->validate([
            'commission_ids' => ['required', 'array', 'min:1'],
            'payment_reference' => ['nullable', 'string'],
        ]);

        $commissions = $this->service->bulkMarkPaid(
            $request->input('commission_ids'),
            auth()->id(),
            $request->input('payment_reference')
        );

        return $this->success(CommissionResource::collection($commissions), 'تم تسجيل الدفع');
    }
}
