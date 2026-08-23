<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\PricingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CropPricing extends Model
{
    protected $table = 'crop_pricing';

    protected $fillable = [
        'crop_id',
        'landed_cost_per_kg',
        'green_cost_per_kg',
        'roasting_loss_percent',
        'roasting_cost_per_kg',
        'packaging_cost_per_unit',
        'operation_cost_per_kg',
        'shipping_cost_per_kg',
        'total_cost_per_kg_roasted',
        'target_margin_percent',
        'retail_price_250g',
        'retail_price_500g',
        'retail_price_1kg',
        'wholesale_price_kg',
        'status',
        'set_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PricingStatus::class,
            'landed_cost_per_kg' => 'decimal:2',
            'green_cost_per_kg' => 'decimal:2',
            'roasting_loss_percent' => 'decimal:2',
            'roasting_cost_per_kg' => 'decimal:2',
            'packaging_cost_per_unit' => 'decimal:2',
            'operation_cost_per_kg' => 'decimal:2',
            'shipping_cost_per_kg' => 'decimal:2',
            'total_cost_per_kg_roasted' => 'decimal:2',
            'target_margin_percent' => 'decimal:2',
            'retail_price_250g' => 'decimal:2',
            'retail_price_500g' => 'decimal:2',
            'retail_price_1kg' => 'decimal:2',
            'wholesale_price_kg' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function setBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
