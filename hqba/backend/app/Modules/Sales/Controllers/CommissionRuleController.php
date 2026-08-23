<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Sales\Models\CommissionRule;
use App\Modules\Sales\Requests\CreateCommissionRuleRequest;
use App\Modules\Sales\Resources\CommissionRuleResource;
use App\Modules\Sales\Services\CommissionService;
use Illuminate\Http\JsonResponse;

class CommissionRuleController extends ApiController
{
    public function __construct(private CommissionService $service) {}

    public function index(): JsonResponse
    {
        return $this->success(CommissionRuleResource::collection($this->service->listRules()));
    }

    public function store(CreateCommissionRuleRequest $request): JsonResponse
    {
        $rule = $this->service->createRule([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return $this->created(new CommissionRuleResource($rule));
    }

    public function update(CreateCommissionRuleRequest $request, CommissionRule $rule): JsonResponse
    {
        $rule = $this->service->updateRule($rule, $request->validated());

        return $this->success(new CommissionRuleResource($rule));
    }
}
