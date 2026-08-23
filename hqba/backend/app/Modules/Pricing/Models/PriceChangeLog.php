<?php

namespace App\Modules\Pricing\Models;

use App\Core\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceChangeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'changes',
        'change_reason',
        'changed_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    // ── Scopes ──

    public function scopeForEntity($query, string $entityType, int $entityId)
    {
        return $query->where('entity_type', $entityType)
            ->where('entity_id', $entityId);
    }
}
