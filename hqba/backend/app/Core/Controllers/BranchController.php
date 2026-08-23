<?php

namespace App\Core\Controllers;

use App\Core\Models\Branch;
use App\Core\Requests\StoreBranchRequest;
use App\Core\Requests\UpdateBranchRequest;
use App\Core\Resources\BranchResource;
use App\Core\Services\BranchService;
use Illuminate\Http\JsonResponse;

class BranchController extends ApiController
{
    public function __construct(
        protected BranchService $branchService,
    ) {}

    public function index(): JsonResponse
    {
        $branches = $this->branchService->list();

        return $this->success(BranchResource::collection($branches));
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $branch = $this->branchService->create($request->validated());

        return $this->created(new BranchResource($branch));
    }

    public function show(Branch $branch): JsonResponse
    {
        $branch->loadCount(['users', 'equipment']);

        return $this->success(new BranchResource($branch));
    }

    public function update(UpdateBranchRequest $request, Branch $branch): JsonResponse
    {
        $branch = $this->branchService->update($branch, $request->validated());

        return $this->success(new BranchResource($branch));
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->branchService->delete($branch);

        return $this->noContent();
    }
}
