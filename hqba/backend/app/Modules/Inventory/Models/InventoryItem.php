<?php

namespace App\Modules\Inventory\Models;

use App\Core\Models\Branch;
use App\Modules\Crops\Models\Crop;
use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class InventoryItem extends Model
{
    use LogsActivity;

    protected $fillable = [
        'branch_id',
        'crop_id',
        'item_type',
        'sku',
        'quantity',
        'unit',
        'min_threshold',
        'last_movement_at',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => ItemType::class,
            'quantity' => 'decimal:2',
            'min_threshold' => 'decimal:2',
            'last_movement_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['quantity', 'min_threshold'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function latestMovement(): HasOne
    {
        return $this->hasOne(InventoryMovement::class)->latestOfMany();
    }

    // ── Scopes ──

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByType($query, ItemType $itemType)
    {
        return $query->where('item_type', $itemType);
    }

    public function scopeForCrop($query, int $cropId)
    {
        return $query->where('crop_id', $cropId);
    }

    public function scopeBelowThreshold($query)
    {
        return $query->whereNotNull('min_threshold')
            ->whereColumn('quantity', '<=', 'min_threshold');
    }

    public function scopeAtRoastery($query)
    {
        return $query->whereHas('branch', fn ($q) => $q->where('type', 'roastery'));
    }

    // ── Helpers ──

    public function isLow(): bool
    {
        return $this->min_threshold !== null && $this->quantity <= $this->min_threshold;
    }
}
