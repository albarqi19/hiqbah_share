<?php

namespace App\Modules\Pricing\Models;

use App\Core\Models\User;
use App\Modules\Orders\Models\Customer;
use App\Modules\Pricing\Enums\DiscountCalculation;
use App\Modules\Pricing\Enums\DiscountType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Discount extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'name_ar',
        'code',
        'type',
        'calculation',
        'value',
        'min_order_amount',
        'min_quantity',
        'max_uses',
        'times_used',
        'customer_id',
        'price_list_id',
        'is_active',
        'valid_from',
        'valid_until',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => DiscountType::class,
            'calculation' => DiscountCalculation::class,
            'value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['is_active', 'value', 'times_used'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ──

    public function scopeValid($query, $now = null)
    {
        $now = $now ?? now();

        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_from')->orWhere('valid_from', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('valid_until')->orWhere('valid_until', '>=', $now);
            })
            ->where(function ($q) {
                $q->whereNull('max_uses')
                    ->orWhereColumn('times_used', '<', 'max_uses');
            });
    }

    // ── Helpers ──

    public function isApplicable(float $subtotal, int $quantity): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->max_uses !== null && $this->times_used >= $this->max_uses) {
            return false;
        }

        $now = now();
        if ($this->valid_from && $now->lt($this->valid_from)) {
            return false;
        }
        if ($this->valid_until && $now->gt($this->valid_until)) {
            return false;
        }

        if ($this->min_order_amount && $subtotal < $this->min_order_amount) {
            return false;
        }

        if ($this->min_quantity && $quantity < $this->min_quantity) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $subtotal): float
    {
        return $this->calculation->calculate($this->value, $subtotal);
    }

    public function localizedName(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name;
    }
}
