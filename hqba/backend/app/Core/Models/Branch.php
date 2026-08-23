<?php

namespace App\Core\Models;

use App\Core\Enums\BranchType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Branch extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'name_ar',
        'type',
        'city',
        'address',
        'phone',
        'is_active',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'type' => BranchType::class,
            'is_active' => 'boolean',
            'settings' => 'json',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'name_ar', 'type', 'is_active'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(Equipment::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ── Helpers ──

    public function isRoastery(): bool
    {
        return $this->type === BranchType::Roastery;
    }

    public function localizedName(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name;
    }
}
