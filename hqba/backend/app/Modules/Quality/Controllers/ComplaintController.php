<?php

namespace App\Modules\Quality\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Quality\Models\Complaint;
use App\Modules\Quality\Services\ComplaintService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends ApiController
{
    public function __construct(protected ComplaintService $service) {}

    public function index(): JsonResponse
    {
        return $this->success($this->service->list());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'crop_id' => ['nullable', 'exists:crops,id'],
            'roast_batch_id' => ['nullable', 'exists:roast_batches,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'severity' => ['required', 'in:low,medium,high,critical'],
        ]);
        $data['created_by'] = auth()->id();
        return $this->created($this->service->create($data));
    }

    public function show(Complaint $complaint): JsonResponse
    {
        $complaint->load(['customer', 'crop', 'roastBatch', 'order', 'creator', 'assignee', 'resolver']);
        return $this->success($complaint);
    }

    public function investigate(Complaint $complaint, Request $request): JsonResponse
    {
        $request->validate(['notes' => ['required', 'string'], 'assigned_to' => ['required', 'exists:users,id']]);
        return $this->success($this->service->investigate($complaint, $request->input('notes'), $request->input('assigned_to')));
    }

    public function resolve(Complaint $complaint, Request $request): JsonResponse
    {
        $request->validate(['resolution' => ['required', 'string']]);
        return $this->success($this->service->resolve($complaint, $request->input('resolution'), auth()->id()));
    }

    public function correctiveAction(Complaint $complaint, Request $request): JsonResponse
    {
        $request->validate([
            'corrective_action' => ['required', 'string'],
        ]);

        $complaint->update([
            'corrective_action' => $request->input('corrective_action'),
        ]);

        return $this->success($complaint->fresh()->load(['customer', 'crop', 'roastBatch', 'order']));
    }
}
