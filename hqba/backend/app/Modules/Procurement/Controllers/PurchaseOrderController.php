<?php

namespace App\Modules\Procurement\Controllers;

use App\Core\Controllers\ApiController;
use App\Core\Enums\ApprovalActionType;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Requests\StorePurchaseOrderRequest;
use App\Modules\Procurement\Requests\UpdatePurchaseOrderRequest;
use App\Modules\Procurement\Resources\PurchaseOrderResource;
use App\Modules\Procurement\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOrderController extends ApiController
{
    public function __construct(
        protected PurchaseOrderService $service,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(PurchaseOrderResource::collection($this->service->list()));
    }

    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $items = $data['items'];
        unset($data['items']);

        $po = $this->service->create($data, $items, auth()->id());

        return $this->created(new PurchaseOrderResource($po));
    }

    public function show(string $purchase_order): JsonResponse
    {
        $po = PurchaseOrder::with(['supplier', 'creator', 'approver', 'items', 'goodsReceiptNotes'])
            ->findOrFail($purchase_order);

        return $this->success(new PurchaseOrderResource($po));
    }

    public function update(UpdatePurchaseOrderRequest $request, string $purchase_order): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($purchase_order);
        $data = $request->validated();
        $items = $data['items'] ?? null;
        unset($data['items']);

        $po = $this->service->update($po, $data, $items);

        return $this->success(new PurchaseOrderResource($po->load(['items', 'supplier'])));
    }

    public function destroy(string $purchase_order): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($purchase_order);
        $this->service->delete($po);

        return $this->noContent();
    }

    public function submit(string $purchase_order): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($purchase_order);
        $po = $this->service->submit($po, auth()->id());

        return $this->success(new PurchaseOrderResource($po));
    }

    public function approve(Request $request, string $purchase_order): JsonResponse
    {
        $request->validate(['comment' => ['nullable', 'string', 'max:1000']]);

        $po = PurchaseOrder::findOrFail($purchase_order);
        $po = $this->service->act($po, $request->user(), ApprovalActionType::Approve, $request->input('comment'));

        return $this->success(new PurchaseOrderResource($po));
    }

    public function reject(Request $request, string $purchase_order): JsonResponse
    {
        $request->validate(['comment' => ['required', 'string', 'max:1000']]);

        $po = PurchaseOrder::findOrFail($purchase_order);
        $po = $this->service->act($po, $request->user(), ApprovalActionType::Reject, $request->input('comment'));

        return $this->success(new PurchaseOrderResource($po));
    }

    public function transition(Request $request, string $purchase_order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $po = PurchaseOrder::findOrFail($purchase_order);
        $po = $this->service->transition($po, $data['status']);

        return $this->success(new PurchaseOrderResource($po));
    }

    public function cancel(Request $request, string $purchase_order): JsonResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);

        $po = PurchaseOrder::findOrFail($purchase_order);
        $po = $this->service->cancel($po, $request->input('reason'));

        return $this->success(new PurchaseOrderResource($po));
    }
}
