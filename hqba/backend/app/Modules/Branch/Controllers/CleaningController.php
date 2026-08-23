<?php

namespace App\Modules\Branch\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Branch\Models\CleaningSchedule;
use App\Modules\Branch\Models\CleaningTask;
use App\Modules\Branch\Resources\CleaningTaskResource;
use App\Modules\Branch\Services\CleaningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CleaningController extends ApiController
{
    public function __construct(protected CleaningService $service) {}

    public function schedules(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id ?? 1);
        return $this->success($this->service->listSchedules($branchId));
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'equipment_id' => ['nullable', 'exists:equipment,id'],
            'area' => ['nullable', 'string', 'in:equipment,bathroom,hall,kitchen,storage,general'],
            'task_name' => ['required', 'string'],
            'task_name_ar' => ['required', 'string'],
            'frequency' => ['required', 'in:daily,weekly,monthly'],
            'time_of_day' => ['nullable', 'string'],
            'steps' => ['nullable', 'array'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
        ]);
        return $this->created($this->service->createSchedule($data));
    }

    public function todayTasks(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id ?? 1);
        $tasks = $this->service->getTodayTasks($branchId);
        return $this->success(CleaningTaskResource::collection($tasks));
    }

    public function startTask(CleaningTask $cleaningTask): JsonResponse
    {
        $task = $this->service->startTask($cleaningTask, auth()->id());
        return $this->success(new CleaningTaskResource($task->load('schedule.equipment')));
    }

    public function completeTask(CleaningTask $cleaningTask, Request $request): JsonResponse
    {
        $task = $this->service->completeTask(
            $cleaningTask, auth()->id(),
            $request->input('after_photos'), $request->input('notes'),
        );
        return $this->success(new CleaningTaskResource($task->load('schedule.equipment')));
    }

    public function reviewTask(CleaningTask $cleaningTask, Request $request): JsonResponse
    {
        $request->validate(['review_status' => ['required', 'in:approved,rejected']]);
        $task = $this->service->reviewTask($cleaningTask, auth()->id(), $request->input('review_status'));
        return $this->success(new CleaningTaskResource($task));
    }

    public function score(Request $request): JsonResponse
    {
        $branchId = $request->input('branch_id', auth()->user()->branch_id ?? 1);
        return $this->success($this->service->getCleanlinessScore($branchId, $request->input('from'), $request->input('to')));
    }
}
