<?php

namespace App\Modules\Production\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Production\Models\RoastQualityCheck;
use App\Modules\Production\Requests\CreateQualityCheckRequest;
use App\Modules\Production\Resources\RoastBatchResource;
use App\Modules\Production\Resources\RoastQualityCheckResource;
use App\Modules\Production\Services\QualityCheckService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QualityCheckController extends ApiController
{
    public function __construct(protected QualityCheckService $service) {}

    public function pending(): JsonResponse
    {
        $batches = $this->service->getPendingBatches();
        return $this->success(RoastBatchResource::collection($batches));
    }

    public function store(RoastBatch $roastBatch, CreateQualityCheckRequest $request): JsonResponse
    {
        $qc = $this->service->create($roastBatch, $request->validated());
        return $this->created(new RoastQualityCheckResource($qc));
    }

    public function decide(RoastQualityCheck $qualityCheck, Request $request): JsonResponse
    {
        $request->validate([
            'decision' => ['required', 'in:approved,rejected,conditional'],
            'reason' => ['nullable', 'string'],
            'corrective_action' => ['nullable', 'string'],
        ]);

        $qc = $this->service->decide(
            $qualityCheck,
            $request->input('decision'),
            $request->input('reason'),
            $request->input('corrective_action'),
        );

        return $this->success(new RoastQualityCheckResource($qc));
    }
}
