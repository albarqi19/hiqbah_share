<?php

namespace App\Modules\Branch\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use App\Modules\Branch\Enums\CleaningStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class CleaningTask extends Model
{
    use LogsActivity;

    protected $fillable = [
        'cleaning_schedule_id', 'branch_id', 'assigned_date', 'status',
        'started_at', 'completed_at', 'completed_by',
        'reviewed_by', 'reviewed_at', 'review_status',
        'before_photos', 'after_photos', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => CleaningStatus::class,
            'assigned_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'before_photos' => 'array',
            'after_photos' => 'array',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status'])->logOnlyDirty();
    }

    public function schedule(): BelongsTo { return $this->belongsTo(CleaningSchedule::class, 'cleaning_schedule_id'); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function completedByUser(): BelongsTo { return $this->belongsTo(User::class, 'completed_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }
}
