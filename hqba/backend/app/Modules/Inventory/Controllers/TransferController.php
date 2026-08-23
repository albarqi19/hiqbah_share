<?php

namespace App\Modules\Inventory\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Inventory\Models\TransferOrder;
use App\Modules\Inventory\Resources\TransferOrderResource;
use App\Modules\Inventory\Services\TransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferController extends ApiController
{
    public function __construct(protected TransferService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(TransferOrderResource::collection($this->service->list()));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'from_branch_id' => ['required', 'exists:branches,id'],
            'to_branch_id' => ['required', 'exists:branches,id', 'different:from_branch_id'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.crop_id' => ['required', 'exists:crops,id'],
            'items.*.item_type' => ['required', 'string'],
            'items.*.quantity_sent' => ['required', 'integer', 'min:1'],
        ]);

        $data = $request->only(['from_branch_id', 'to_branch_id', 'notes']);
        $data['created_by'] = auth()->id();
        $transfer = $this->service->create($data, $request->input('items'));
        return $this->created(new TransferOrderResource($transfer));
    }

    public function show(TransferOrder $transferOrder): JsonResponse
    {
        $transferOrder->load(['fromBranch', 'toBranch', 'items.crop', 'creator']);
        return $this->success(new TransferOrderResource($transferOrder));
    }

    public function approve(TransferOrder $transferOrder): JsonResponse
    {
        $transfer = $this->service->approve($transferOrder, auth()->id());
        return $this->success(new TransferOrderResource($transfer->load(['fromBranch', 'toBranch', 'items.crop'])));
    }

    public function ship(TransferOrder $transferOrder): JsonResponse
    {
        $transfer = $this->service->ship($transferOrder, auth()->id());
        return $this->success(new TransferOrderResource($transfer->load(['fromBranch', 'toBranch', 'items.crop'])));
    }

    public function receive(TransferOrder $transferOrder, Request $request): JsonResponse
    {
        $request->validate([
            'received_quantities' => ['required', 'array'],
            'received_quantities.*' => ['integer', 'min:0'],
        ]);
        $transfer = $this->service->receive($transferOrder, $request->input('received_quantities'), auth()->id());
        return $this->success(new TransferOrderResource($transfer->load(['fromBranch', 'toBranch', 'items.crop'])));
    }

    public function confirm(TransferOrder $transferOrder): JsonResponse
    {
        $transfer = $this->service->confirm($transferOrder);
        return $this->success(new TransferOrderResource($transfer->load(['fromBranch', 'toBranch', 'items.crop'])));
    }
}
