<?php

namespace App\Modules\Production\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Production\Models\PackagingLot;
use App\Modules\Production\Requests\CreatePackagingLotRequest;
use App\Modules\Production\Resources\PackagingLotResource;
use App\Modules\Production\Services\PackagingService;
use Illuminate\Http\JsonResponse;

class PackagingController extends ApiController
{
    public function __construct(protected PackagingService $service) {}

    public function index(): JsonResponse
    {
        $lots = $this->service->list();
        return $this->success(PackagingLotResource::collection($lots));
    }

    public function store(CreatePackagingLotRequest $request): JsonResponse
    {
        $lot = $this->service->create($request->validated());
        return $this->created(new PackagingLotResource($lot));
    }

    public function show(PackagingLot $packagingLot): JsonResponse
    {
        $packagingLot->load(['crop', 'roastBatch', 'packer']);
        return $this->success(new PackagingLotResource($packagingLot));
    }

    public function complete(PackagingLot $packagingLot): JsonResponse
    {
        $lot = $this->service->complete($packagingLot);
        return $this->success(new PackagingLotResource($lot));
    }
}
