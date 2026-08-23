<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CuppingSession;
use App\Modules\Crops\Requests\StoreCuppingSessionRequest;
use App\Modules\Crops\Resources\CuppingSessionResource;
use App\Modules\Crops\Services\CuppingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CuppingSessionController extends ApiController
{
    public function __construct(
        protected CuppingService $cuppingService,
    ) {}

    public function index(string $crop): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $sessions = $this->cuppingService->listForCrop($crop);

        return $this->success(CuppingSessionResource::collection($sessions));
    }

    public function store(string $crop, StoreCuppingSessionRequest $request): JsonResponse
    {
        $crop = Crop::findOrFail($crop);
        $session = $this->cuppingService->schedule($crop, $request->validated());

        return $this->created(new CuppingSessionResource($session));
    }

    public function show(string $id): JsonResponse
    {
        $cuppingSession = CuppingSession::findOrFail($id);
        $cuppingSession->load(['crop', 'trialRoast', 'grader']);

        return $this->success(new CuppingSessionResource($cuppingSession));
    }

    public function update(string $id, Request $request): JsonResponse
    {
        $cuppingSession = CuppingSession::findOrFail($id);
        $session = $this->cuppingService->update($cuppingSession, $request->all());

        return $this->success(new CuppingSessionResource($session));
    }

    public function destroy(string $id): JsonResponse
    {
        $cuppingSession = CuppingSession::findOrFail($id);
        $this->cuppingService->delete($cuppingSession);

        return $this->noContent();
    }

    public function complete(string $id, Request $request): JsonResponse
    {
        $cuppingSession = CuppingSession::findOrFail($id);
        $session = $this->cuppingService->complete($cuppingSession, $request->all());

        return $this->success(new CuppingSessionResource($session));
    }

    public function decide(string $id, Request $request): JsonResponse
    {
        $cuppingSession = CuppingSession::findOrFail($id);
        $request->validate([
            'decision' => ['required', 'in:approved,rejected,retest'],
            'reason' => ['nullable', 'string'],
        ]);

        $session = $this->cuppingService->decide(
            $cuppingSession,
            $request->input('decision'),
            $request->input('reason'),
        );

        return $this->success(new CuppingSessionResource($session));
    }
}
