<?php

namespace App\Core\Controllers;

use App\Core\Models\Equipment;
use App\Core\Requests\StoreEquipmentRequest;
use App\Core\Requests\UpdateEquipmentRequest;
use App\Core\Resources\EquipmentResource;
use App\Core\Services\EquipmentService;
use Illuminate\Http\JsonResponse;

class EquipmentController extends ApiController
{
    public function __construct(
        protected EquipmentService $equipmentService,
    ) {}

    public function index(): JsonResponse
    {
        $equipment = $this->equipmentService->list();

        return $this->success(EquipmentResource::collection($equipment));
    }

    public function store(StoreEquipmentRequest $request): JsonResponse
    {
        $equipment = $this->equipmentService->create($request->validated());

        return $this->created(new EquipmentResource($equipment));
    }

    public function show(Equipment $equipment): JsonResponse
    {
        $equipment->load('branch');

        return $this->success(new EquipmentResource($equipment));
    }

    public function update(UpdateEquipmentRequest $request, Equipment $equipment): JsonResponse
    {
        $equipment = $this->equipmentService->update($equipment, $request->validated());

        return $this->success(new EquipmentResource($equipment));
    }

    public function destroy(Equipment $equipment): JsonResponse
    {
        $this->equipmentService->delete($equipment);

        return $this->noContent();
    }
}
