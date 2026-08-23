<?php

namespace App\Modules\Branch\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Branch\Models\CalibrationSession;
use App\Modules\Branch\Requests\AddShotRequest;
use App\Modules\Branch\Requests\StartCalibrationRequest;
use App\Modules\Branch\Resources\CalibrationSessionResource;
use App\Modules\Branch\Services\CalibrationService;
use Illuminate\Http\JsonResponse;

class CalibrationController extends ApiController
{
    public function __construct(protected CalibrationService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(CalibrationSessionResource::collection($this->service->list()));
    }

    public function store(StartCalibrationRequest $request): JsonResponse
    {
        $session = $this->service->startSession($request->validated());
        return $this->created(new CalibrationSessionResource($session));
    }

    public function show(CalibrationSession $calibrationSession): JsonResponse
    {
        $calibrationSession->load(['branch', 'machine', 'grinder', 'crop', 'recipe.espressoRecipe', 'barista', 'shots']);
        return $this->success(new CalibrationSessionResource($calibrationSession));
    }

    public function addShot(CalibrationSession $calibrationSession, AddShotRequest $request): JsonResponse
    {
        $shot = $this->service->addShot($calibrationSession, $request->validated());
        $calibrationSession->load(['shots', 'recipe.espressoRecipe']);
        return $this->created(new CalibrationSessionResource($calibrationSession));
    }

    public function finish(CalibrationSession $calibrationSession): JsonResponse
    {
        $session = $this->service->finishSession($calibrationSession);
        return $this->success(new CalibrationSessionResource($session));
    }

    public function approve(CalibrationSession $calibrationSession): JsonResponse
    {
        $session = $this->service->approveSession($calibrationSession, auth()->id());
        return $this->success(new CalibrationSessionResource($session));
    }

    public function baristaStats(): JsonResponse
    {
        $branchId = request('branch_id') ? (int) request('branch_id') : null;
        return $this->success($this->service->getBaristaStats($branchId));
    }
}
