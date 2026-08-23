<?php

namespace App\Modules\Branch\Services;

use App\Modules\Branch\Enums\CleaningStatus;
use App\Modules\Branch\Models\CleaningSchedule;
use App\Modules\Branch\Models\CleaningTask;
use Illuminate\Support\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CleaningService
{
    public function listSchedules(int $branchId)
    {
        return CleaningSchedule::where('branch_id', $branchId)->with('equipment')->get();
    }

    public function createSchedule(array $data): CleaningSchedule
    {
        return CleaningSchedule::create($data);
    }

    public function updateSchedule(CleaningSchedule $schedule, array $data): CleaningSchedule
    {
        $schedule->update($data);
        return $schedule->fresh();
    }

    /**
     * Generate today's tasks from active schedules.
     */
    public function generateDailyTasks(int $branchId): Collection
    {
        $schedules = CleaningSchedule::where('branch_id', $branchId)
            ->active()
            ->get();

        $today = now()->toDateString();
        $created = collect();

        foreach ($schedules as $schedule) {
            $shouldCreate = match ($schedule->frequency) {
                'daily' => true,
                'weekly' => now()->dayOfWeek === 0, // Sunday
                'monthly' => now()->day === 1,
                default => false,
            };

            if (!$shouldCreate) continue;

            $task = CleaningTask::firstOrCreate(
                ['cleaning_schedule_id' => $schedule->id, 'assigned_date' => $today],
                ['branch_id' => $branchId, 'status' => CleaningStatus::Pending->value],
            );
            $created->push($task);
        }

        return $created;
    }

    public function getTodayTasks(int $branchId): Collection
    {
        // Generate if not exists
        $this->generateDailyTasks($branchId);

        return CleaningTask::where('branch_id', $branchId)
            ->whereDate('assigned_date', today())
            ->with(['schedule.equipment', 'completedByUser'])
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 1 WHEN 'pending' THEN 2 WHEN 'completed' THEN 3 WHEN 'reviewed' THEN 4 ELSE 5 END")
            ->get();
    }

    public function startTask(CleaningTask $task, int $userId): CleaningTask
    {
        $task->update(['status' => CleaningStatus::InProgress, 'started_at' => now()]);
        return $task->fresh();
    }

    public function completeTask(CleaningTask $task, int $userId, ?array $afterPhotos = null, ?string $notes = null): CleaningTask
    {
        $task->update([
            'status' => CleaningStatus::Completed,
            'completed_at' => now(),
            'completed_by' => $userId,
            'after_photos' => $afterPhotos,
            'notes' => $notes,
        ]);
        return $task->fresh();
    }

    public function reviewTask(CleaningTask $task, int $reviewerId, string $reviewStatus): CleaningTask
    {
        $task->update([
            'status' => CleaningStatus::Reviewed,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_status' => $reviewStatus,
        ]);
        return $task->fresh();
    }

    public function getCleanlinessScore(int $branchId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = CleaningTask::where('branch_id', $branchId);
        if ($dateFrom) $query->where('assigned_date', '>=', $dateFrom);
        if ($dateTo) $query->where('assigned_date', '<=', $dateTo);

        $total = $query->count();
        $completed = (clone $query)->whereIn('status', ['completed', 'reviewed'])->count();
        $onTime = (clone $query)->whereIn('status', ['completed', 'reviewed'])
            ->whereNotNull('completed_at')
            ->whereRaw("completed_at <= assigned_date::timestamp + interval '1 day'")->count();

        return [
            'total_tasks' => $total,
            'completed' => $completed,
            'on_time' => $onTime,
            'score' => $total > 0 ? round(($completed / $total) * 100) : 100,
        ];
    }
}
