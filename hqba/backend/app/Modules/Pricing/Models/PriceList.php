<?php

namespace App\Modules\Pricing\Models;

use App\Core\Models\User;
use App\Modules\Pricing\Enums\PriceListStatus;
use App\Modules\Pricing\Enums\PriceListType;
use App\Modules\Pricing\Enums\RoundingRule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PriceList extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'name_ar',
        'code',
        'type',
        'currency',
        'is_default',
        'is_active',
        'description',
        'description_ar',
        'rounding_rule',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => PriceListType::class,
            'status' => PriceListStatus::class,
            'rounding_rule' => RoundingRule::class,
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'is_active', 'is_default'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function items(): HasMany
    {
        return $this->hasMany(PriceListItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', PriceListStatus::Active);
    }

    public function scopeOfType($query, PriceListType $type)
    {
        return $query->where('type', $type);
    }

    // ── Helpers ──

    public function localizedName(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name;
    }
}
