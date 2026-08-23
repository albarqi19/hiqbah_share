<?php

namespace App\Modules\Crops\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Crops\Models\GreenCoffeeInspection;
use App\Modules\Crops\Models\GreenCoffeeLot;
use App\Modules\Crops\Requests\StoreGreenCoffeeLotRequest;
use App\Modules\Crops\Requests\StoreInspectionRequest;
use App\Modules\Crops\Resources\GreenCoffeeInspectionResource;
use App\Modules\Crops\Resources\GreenCoffeeLotResource;
use App\Modules\Crops\Services\GreenCoffeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GreenCoffeeController extends ApiController
{
    public function __construct(
        protected GreenCoffeeService $greenCoffeeService,
    ) {}

    public function index(): JsonResponse
    {
        $lots = $this->greenCoffeeService->listLots();

        return $this->success(GreenCoffeeLotResource::collection($lots));
    }

    public function show(string $id): JsonResponse
    {
        $greenCoffeeLot = GreenCoffeeLot::findOrFail($id);
        $greenCoffeeLot->load(['crop', 'receivedBy', 'inspections.inspector']);

        return $this->success(new GreenCoffeeLotResource($greenCoffeeLot));
    }

    public function receive(StoreGreenCoffeeLotRequest $request): JsonResponse
    {
        $lot = $this->greenCoffeeService->receive($request->validated());

        return $this->created(new GreenCoffeeLotResource($lot));
    }

    public function inspect(string $id, StoreInspectionRequest $request): JsonResponse
    {
        $greenCoffeeLot = GreenCoffeeLot::findOrFail($id);
        $inspection = $this->greenCoffeeService->inspect($greenCoffeeLot, $request->validated());

        return $this->created(new GreenCoffeeInspectionResource($inspection));
    }

    public function decide(string $id, Request $request): JsonResponse
    {
        $greenCoffeeInspection = GreenCoffeeInspection::findOrFail($id);
        $request->validate([
            'decision' => ['required', 'in:approved,rejected,conditional'],
            'reason' => ['nullable', 'string'],
            'condition_notes' => ['nullable', 'string'],
        ]);

        $inspection = $this->greenCoffeeService->decide(
            $greenCoffeeInspection,
            $request->input('decision'),
            $request->input('reason'),
            $request->input('condition_notes'),
        );

        return $this->success(new GreenCoffeeInspectionResource($inspection));
    }
}
