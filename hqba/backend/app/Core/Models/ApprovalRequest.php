<?php

namespace App\Core\Models;

use App\Core\Enums\ApprovalRequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalRequest extends Model
{
    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'approval_rule_id',
        'requested_by',
        'amount',
        'status',
        'current_step',
        'total_steps',
        'completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalRequestStatus::class,
            'amount' => 'decimal:2',
            'current_step' => 'integer',
            'total_steps' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ApprovalRule::class, 'approval_rule_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class);
    }

    // ── Scopes ──

    public function scopePending($query)
    {
        return $query->where('status', ApprovalRequestStatus::Pending);
    }

    public function isPending(): bool
    {
        return $this->status === ApprovalRequestStatus::Pending;
    }
}
