<?php

namespace App\Core\Models;

use App\Core\Enums\EquipmentStatus;
use App\Core\Enums\EquipmentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Equipment extends Model
{
    use LogsActivity;

    protected $table = 'equipment';

    protected $fillable = [
        'branch_id',
        'type',
        'code',
        'name',
        'brand',
        'model',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type' => EquipmentType::class,
            'status' => EquipmentStatus::class,
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'code', 'type', 'status', 'branch_id'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', EquipmentStatus::Active);
    }

    public function scopeOfType($query, EquipmentType $type)
    {
        return $query->where('type', $type);
    }

    public function scopeInBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
