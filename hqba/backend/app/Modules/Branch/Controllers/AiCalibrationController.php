<?php

namespace App\Modules\Branch\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Branch\Services\AiCalibrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiCalibrationController extends ApiController
{
    public function __construct(protected AiCalibrationService $service) {}

    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'crop_id' => ['required', 'exists:crops,id'],
            'equipment_grinder_id' => ['nullable', 'exists:equipment,id'],
            'equipment_machine_id' => ['nullable', 'exists:equipment,id'],
        ]);

        $suggestion = $this->service->analyze(
            $request->input('branch_id'),
            $request->input('crop_id'),
            auth()->id(),
            $request->input('equipment_grinder_id'),
            $request->input('equipment_machine_id'),
        );

        return $this->success($suggestion);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id ?? 1);
        return $this->success($this->service->getSuggestions($branchId, $request->input('crop_id')));
    }
}
