<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\TrialRoast;
use App\Modules\Crops\Requests\StoreTrialRoastRequest;
use App\Modules\Crops\Resources\TrialRoastResource;
use App\Modules\Crops\Services\TrialRoastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrialRoastController extends ApiController
{
    public function __construct(
        protected TrialRoastService $trialRoastService,
    ) {}

    public function index(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $trials = $this->trialRoastService->listForCrop($crop);

        return $this->success(TrialRoastResource::collection($trials));
    }

    public function store(string $crop, StoreTrialRoastRequest $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $trial = $this->trialRoastService->create($crop, $request->validated());

        return $this->created(new TrialRoastResource($trial));
    }

    public function show(string $id): JsonResponse
    {
        $trialRoast = TrialRoast::findOrFail($id);
        $trialRoast->load(['crop', 'greenCoffeeLot', 'roaster', 'cuppingSessions']);

        return $this->success(new TrialRoastResource($trialRoast));
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $trialRoast = TrialRoast::findOrFail($id);
        $trial = $this->trialRoastService->update($trialRoast, $request->all());

        return $this->success(new TrialRoastResource($trial));
    }

    public function destroy(string $id): JsonResponse
    {
        $trialRoast = TrialRoast::findOrFail($id);
        $this->trialRoastService->delete($trialRoast);

        return $this->noContent();
    }

    public function complete(string $id, Request $request): JsonResponse
    {
        $trialRoast = TrialRoast::findOrFail($id);
        $trial = $this->trialRoastService->complete($trialRoast, $request->all());

        return $this->success(new TrialRoastResource($trial));
    }

    public function select(string $id): JsonResponse
    {
        $trialRoast = TrialRoast::findOrFail($id);
        $trial = $this->trialRoastService->select($trialRoast);

        return $this->success(new TrialRoastResource($trial));
    }
}
