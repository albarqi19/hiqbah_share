<?php

namespace App\Modules\Procurement\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Procurement\Models\Supplier;
use App\Modules\Procurement\Requests\StoreSupplierRequest;
use App\Modules\Procurement\Requests\UpdateSupplierRequest;
use App\Modules\Procurement\Resources\SupplierResource;
use App\Modules\Procurement\Services\SupplierService;
use Illuminate\Http\JsonResponse;

class SupplierController extends ApiController
{
    public function __construct(
        protected SupplierService $supplierService,
    ) {}

    public function index(): JsonResponse
    {
        $suppliers = $this->supplierService->list();

        return $this->success(SupplierResource::collection($suppliers));
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->create($request->validated());

        return $this->created(new SupplierResource($supplier));
    }

    public function show(string $supplier): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplier);

        return $this->success(new SupplierResource($supplier));
    }

    public function update(UpdateSupplierRequest $request, string $supplier): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplier);
        $supplier = $this->supplierService->update($supplier, $request->validated());

        return $this->success(new SupplierResource($supplier));
    }

    public function destroy(string $supplier): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplier);
        $this->supplierService->delete($supplier);

        return $this->noContent();
    }
}
