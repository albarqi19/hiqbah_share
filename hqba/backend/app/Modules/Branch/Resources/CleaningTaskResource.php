<?php

namespace App\Modules\Branch\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CleaningTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'assigned_date' => $this->assigned_date->toDateString(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_label_en' => $this->status->labelEn(),
            'schedule' => $this->whenLoaded('schedule', fn () => [
                'id' => $this->schedule->id,
                'task_name' => $this->schedule->task_name,
                'task_name_ar' => $this->schedule->task_name_ar,
                'frequency' => $this->schedule->frequency,
                'time_of_day' => $this->schedule->time_of_day,
                'steps' => $this->schedule->steps,
                'duration_minutes' => $this->schedule->duration_minutes,
                'equipment' => $this->schedule->relationLoaded('equipment') && $this->schedule->equipment
                    ? ['id' => $this->schedule->equipment->id, 'name' => $this->schedule->equipment->name, 'code' => $this->schedule->equipment->code]
                    : null,
            ]),
            'completed_by' => $this->whenLoaded('completedByUser', fn () => [
                'id' => $this->completedByUser->id, 'name' => $this->completedByUser->name, 'name_ar' => $this->completedByUser->name_ar,
            ]),
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'review_status' => $this->review_status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }
}
