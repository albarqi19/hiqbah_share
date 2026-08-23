<?php

namespace App\Modules\Procurement\Controllers;

use App\Core\Controllers\ApiController;
use App\Core\Enums\ApprovalActionType;
use App\Modules\Procurement\Models\PurchaseRequisition;
use App\Modules\Procurement\Requests\StorePurchaseRequisitionRequest;
use App\Modules\Procurement\Requests\UpdatePurchaseRequisitionRequest;
use App\Modules\Procurement\Resources\PurchaseRequisitionResource;
use App\Modules\Procurement\Services\PurchaseRequisitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseRequisitionController extends ApiController
{
    public function __construct(
        protected PurchaseRequisitionService $service,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(PurchaseRequisitionResource::collection($this->service->list()));
    }

    public function store(StorePurchaseRequisitionRequest $request): JsonResponse
    {
        $req = $this->service->create($request->validated(), auth()->id());

        return $this->created(new PurchaseRequisitionResource($req));
    }

    public function show(string $requisition): JsonResponse
    {
        $req = PurchaseRequisition::with(['requester', 'approver', 'preferredSupplier', 'purchaseOrder'])
            ->findOrFail($requisition);

        return $this->success(new PurchaseRequisitionResource($req));
    }

    public function update(UpdatePurchaseRequisitionRequest $request, string $requisition): JsonResponse
    {
        $req = PurchaseRequisition::findOrFail($requisition);
        $req = $this->service->update($req, $request->validated());

        return $this->success(new PurchaseRequisitionResource($req));
    }

    public function destroy(string $requisition): JsonResponse
    {
        $req = PurchaseRequisition::findOrFail($requisition);
        $this->service->delete($req);

        return $this->noContent();
    }

    public function submit(string $requisition): JsonResponse
    {
        $req = PurchaseRequisition::findOrFail($requisition);
        $req = $this->service->submit($req, auth()->id());

        return $this->success(new PurchaseRequisitionResource($req));
    }

    public function approve(Request $request, string $requisition): JsonResponse
    {
        $request->validate(['comment' => ['nullable', 'string', 'max:1000']]);

        $req = PurchaseRequisition::findOrFail($requisition);
        $req = $this->service->act($req, $request->user(), ApprovalActionType::Approve, $request->input('comment'));

        return $this->success(new PurchaseRequisitionResource($req));
    }

    public function reject(Request $request, string $requisition): JsonResponse
    {
        $request->validate(['comment' => ['required', 'string', 'max:1000']]);

        $req = PurchaseRequisition::findOrFail($requisition);
        $req = $this->service->act($req, $request->user(), ApprovalActionType::Reject, $request->input('comment'));

        return $this->success(new PurchaseRequisitionResource($req));
    }

    public function cancel(Request $request, string $requisition): JsonResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);

        $req = PurchaseRequisition::findOrFail($requisition);
        $req = $this->service->cancel($req, $request->input('reason'));

        return $this->success(new PurchaseRequisitionResource($req));
    }
}
