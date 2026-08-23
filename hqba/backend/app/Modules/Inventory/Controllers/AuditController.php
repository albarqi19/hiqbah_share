<?php

namespace App\Modules\Inventory\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Inventory\Models\InventoryAudit;
use App\Modules\Inventory\Models\InventoryAuditItem;
use App\Modules\Inventory\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends ApiController
{
    public function __construct(protected AuditService $service) {}

    public function index(): JsonResponse
    {
        return $this->success($this->service->list());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'audit_type' => ['required', 'in:green,roasted,finished,bar,full'],
        ]);
        $audit = $this->service->open($request->input('branch_id'), $request->input('audit_type'), auth()->id());
        return $this->created($audit);
    }

    public function show(InventoryAudit $audit): JsonResponse
    {
        $audit->load(['branch', 'opener', 'items.crop']);
        return $this->success($audit);
    }

    public function countItem(InventoryAudit $audit, InventoryAuditItem $item, Request $request): JsonResponse
    {
        $request->validate([
            'actual_quantity' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);
        $item = $this->service->countItem($item, (float) $request->input('actual_quantity'), auth()->id(), $request->input('notes'));
        return $this->success($item);
    }

    public function approve(InventoryAudit $audit): JsonResponse
    {
        $audit = $this->service->approve($audit, auth()->id());
        return $this->success($audit);
    }

    public function close(InventoryAudit $audit): JsonResponse
    {
        $audit = $this->service->close($audit, auth()->id());
        return $this->success($audit);
    }
}
