<?php

namespace App\Modules\Production\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Production\Requests\CompleteRoastBatchRequest;
use App\Modules\Production\Requests\CreateRoastBatchRequest;
use App\Modules\Production\Resources\RoastBatchResource;
use App\Modules\Production\Services\RoastingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoastingController extends ApiController
{
    public function __construct(
        protected RoastingService $roastingService,
    ) {}

    public function queue(): JsonResponse
    {
        $batches = $this->roastingService->getQueue();

        return $this->success(RoastBatchResource::collection($batches));
    }

    public function store(CreateRoastBatchRequest $request): JsonResponse
    {
        $batch = $this->roastingService->create($request->validated());

        return $this->created(new RoastBatchResource($batch));
    }

    public function show(RoastBatch $roastBatch): JsonResponse
    {
        $batch = $this->roastingService->show($roastBatch);

        return $this->success(new RoastBatchResource($batch));
    }

    public function start(RoastBatch $roastBatch): JsonResponse
    {
        $batch = $this->roastingService->start($roastBatch);

        return $this->success(new RoastBatchResource($batch));
    }

    public function complete(RoastBatch $roastBatch, CompleteRoastBatchRequest $request): JsonResponse
    {
        $batch = $this->roastingService->complete($roastBatch, $request->validated());

        return $this->success(new RoastBatchResource($batch));
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'batch_ids' => ['required', 'array'],
            'batch_ids.*' => ['integer', 'exists:roast_batches,id'],
        ]);

        $this->roastingService->reorder($request->input('batch_ids'));

        return $this->success(null, 'Queue reordered');
    }
}
