<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\User;
use App\Modules\Sales\Enums\CommissionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionRule extends Model
{
    protected $fillable = [
        'name',
        'name_ar',
        'type',
        'value',
        'sales_rep_id',
        'customer_tier',
        'min_order_total',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => CommissionType::class,
            'value' => 'decimal:2',
            'min_order_total' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
