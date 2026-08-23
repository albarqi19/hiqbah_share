<?php

namespace App\Core\Models;

use App\Core\Enums\ApprovalType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRule extends Model
{
    protected $fillable = [
        'name',
        'entity_type',
        'min_amount',
        'max_amount',
        'required_approvers',
        'approval_type',
        'priority',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'required_approvers' => 'array',
            'approval_type' => ApprovalType::class,
            'is_active' => 'boolean',
            'priority' => 'integer',
        ];
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    /**
     * Find the matching rule for an entity + amount.
     * Picks highest-priority active rule whose [min_amount, max_amount] range covers the amount.
     */
    public static function findMatching(string $entityType, float $amount): ?self
    {
        return static::query()
            ->where('entity_type', $entityType)
            ->where('is_active', true)
            ->where('min_amount', '<=', $amount)
            ->where(function ($q) use ($amount) {
                $q->whereNull('max_amount')->orWhere('max_amount', '>=', $amount);
            })
            ->orderByDesc('priority')
            ->orderBy('min_amount', 'desc')
            ->first();
    }
}
