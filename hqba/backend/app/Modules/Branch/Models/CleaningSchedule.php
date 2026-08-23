<?php

namespace App\Modules\Branch\Models;

use App\Core\Models\Branch;
use App\Core\Models\Equipment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CleaningSchedule extends Model
{
    protected $fillable = [
        'branch_id', 'equipment_id', 'area', 'task_name', 'task_name_ar',
        'frequency', 'time_of_day', 'steps', 'duration_minutes', 'is_active',
    ];

    protected function casts(): array
    {
        return ['steps' => 'array', 'is_active' => 'boolean'];
    }

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function equipment(): BelongsTo { return $this->belongsTo(Equipment::class); }
    public function tasks(): HasMany { return $this->hasMany(CleaningTask::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }
}
