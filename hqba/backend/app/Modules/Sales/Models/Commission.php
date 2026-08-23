<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\User;
use App\Modules\Orders\Models\Order;
use App\Modules\Sales\Enums\CommissionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Commission extends Model
{
    use LogsActivity;

    protected $fillable = [
        'order_id',
        'sales_rep_id',
        'commission_rule_id',
        'order_total',
        'commission_amount',
        'calculation_method',
        'calculation_value',
        'status',
        'approved_by',
        'approved_at',
        'paid_by',
        'paid_at',
        'payment_reference',
        'reversed_by_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => CommissionStatus::class,
            'order_total' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'calculation_value' => 'decimal:2',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'commission_amount'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function commissionRule(): BelongsTo
    {
        return $this->belongsTo(CommissionRule::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversed_by_id');
    }

    // ── Scopes ──

    public function scopeByStatus($query, CommissionStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByRep($query, int $repId)
    {
        return $query->where('sales_rep_id', $repId);
    }
}
