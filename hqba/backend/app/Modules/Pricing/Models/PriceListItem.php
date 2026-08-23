<?php

namespace App\Modules\Pricing\Models;

use App\Modules\Crops\Models\Crop;
use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PriceListItem extends Model
{
    use LogsActivity;

    protected $fillable = [
        'price_list_id',
        'crop_id',
        'item_type',
        'unit_price',
        'min_quantity',
        'effective_from',
        'effective_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => ItemType::class,
            'unit_price' => 'decimal:2',
            'min_quantity' => 'decimal:2',
            'effective_from' => 'datetime',
            'effective_until' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['unit_price', 'is_active'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    // ── Scopes ──

    public function scopeEffectiveOn($query, $date = null)
    {
        $date = $date ?? now();

        return $query->where('is_active', true)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $date);
            })
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_until')
                    ->orWhere('effective_until', '>=', $date);
            });
    }
}
