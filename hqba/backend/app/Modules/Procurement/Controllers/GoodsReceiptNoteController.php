<?php

namespace App\Modules\Procurement\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Procurement\Models\GoodsReceiptNote;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Requests\StoreGoodsReceiptNoteRequest;
use App\Modules\Procurement\Resources\GoodsReceiptNoteResource;
use App\Modules\Procurement\Services\GoodsReceiptNoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoodsReceiptNoteController extends ApiController
{
    public function __construct(
        protected GoodsReceiptNoteService $service,
    ) {}

    public function index(): JsonResponse
    {
        return $this->success(GoodsReceiptNoteResource::collection($this->service->list()));
    }

    public function show(string $grn): JsonResponse
    {
        $model = GoodsReceiptNote::with(['receiver', 'qcCompleter', 'items.purchaseOrderItem', 'purchaseOrder'])
            ->findOrFail($grn);

        return $this->success(new GoodsReceiptNoteResource($model));
    }

    /**
     * Receive goods against a specific PO.
     */
    public function store(StoreGoodsReceiptNoteRequest $request, string $purchase_order): JsonResponse
    {
        $po = PurchaseOrder::findOrFail($purchase_order);
        $data = $request->validated();
        $items = $data['items'];
        unset($data['items']);

        $grn = $this->service->receive($po, $data, $items, auth()->id());

        return $this->created(new GoodsReceiptNoteResource($grn));
    }

    public function startQualityCheck(string $grn): JsonResponse
    {
        $model = GoodsReceiptNote::findOrFail($grn);
        $model = $this->service->startQualityCheck($model);

        return $this->success(new GoodsReceiptNoteResource($model));
    }

    public function completeQualityCheck(Request $request, string $grn): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', 'in:accepted,conditionally_accepted,rejected'],
            'moisture_percent' => ['nullable', 'numeric', 'between:0,100'],
            'cupping_score' => ['nullable', 'numeric', 'between:0,100'],
            'notes' => ['nullable', 'string'],
        ]);

        $model = GoodsReceiptNote::findOrFail($grn);
        $model = $this->service->completeQualityCheck(
            $model,
            $data['decision'],
            auth()->id(),
            [
                'moisture_percent' => $data['moisture_percent'] ?? null,
                'cupping_score' => $data['cupping_score'] ?? null,
                'notes' => $data['notes'] ?? null,
            ],
        );

        return $this->success(new GoodsReceiptNoteResource($model));
    }
}
