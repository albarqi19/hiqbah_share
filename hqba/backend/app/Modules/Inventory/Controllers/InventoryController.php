<?php

namespace App\Modules\Inventory\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Inventory\Enums\ItemType;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Requests\AdjustInventoryRequest;
use App\Modules\Inventory\Requests\ReconcileInventoryRequest;
use App\Modules\Inventory\Requests\SetThresholdRequest;
use App\Modules\Inventory\Resources\InventoryItemResource;
use App\Modules\Inventory\Resources\InventoryMovementResource;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Http\JsonResponse;

class InventoryController extends ApiController
{
    public function __construct(
        protected InventoryService $inventoryService,
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->inventoryService->getStock();

        return $this->success(InventoryItemResource::collection($items));
    }

    public function show(InventoryItem $inventoryItem): JsonResponse
    {
        $inventoryItem->load(['branch', 'crop', 'movements' => fn ($q) => $q->with('staff')->latest('created_at')->limit(20)]);

        return $this->success([
            'item' => new InventoryItemResource($inventoryItem),
            'recent_movements' => InventoryMovementResource::collection($inventoryItem->movements),
        ]);
    }

    public function movements(): JsonResponse
    {
        $movements = $this->inventoryService->getMovements();

        return $this->success(InventoryMovementResource::collection($movements));
    }

    public function alerts(): JsonResponse
    {
        $branchId = request('branch_id') ? (int) request('branch_id') : null;
        $alerts = $this->inventoryService->getAlerts($branchId);

        return $this->success(InventoryItemResource::collection($alerts));
    }

    public function summary(): JsonResponse
    {
        $branchId = request('branch_id') ? (int) request('branch_id') : null;
        $summary = $this->inventoryService->getSummary($branchId);

        return $this->success($summary);
    }

    public function valuation(): JsonResponse
    {
        $branchId = request('branch_id') ? (int) request('branch_id') : null;
        $valuation = $this->inventoryService->getValuation($branchId);

        return $this->success($valuation);
    }

    public function adjust(AdjustInventoryRequest $request): JsonResponse
    {
        try {
            $movement = $this->inventoryService->adjust(
                $request->input('branch_id'),
                $request->input('crop_id'),
                ItemType::from($request->input('item_type')),
                (float) $request->input('new_quantity'),
                auth()->id(),
                $request->input('reason'),
            );

            return $this->success(new InventoryMovementResource($movement));
        } catch (InsufficientStockException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function reconcile(ReconcileInventoryRequest $request): JsonResponse
    {
        try {
            $movement = $this->inventoryService->reconcile(
                $request->input('branch_id'),
                $request->input('crop_id'),
                ItemType::from($request->input('item_type')),
                (float) $request->input('actual_quantity'),
                auth()->id(),
                $request->input('notes'),
            );

            return $this->success(new InventoryMovementResource($movement));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function setThreshold(InventoryItem $inventoryItem, SetThresholdRequest $request): JsonResponse
    {
        $item = $this->inventoryService->setThreshold(
            $inventoryItem,
            (float) $request->input('min_threshold'),
        );

        return $this->success(new InventoryItemResource($item));
    }
}
