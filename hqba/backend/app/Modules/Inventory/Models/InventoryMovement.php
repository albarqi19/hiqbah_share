<?php

namespace App\Modules\Inventory\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Inventory\Enums\MovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryMovement extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'inventory_item_id',
        'branch_id',
        'crop_id',
        'movement_type',
        'direction',
        'quantity',
        'balance_after',
        'reference_type',
        'reference_id',
        'cost_per_unit',
        'total_cost',
        'staff_id',
        'notes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'movement_type' => MovementType::class,
            'quantity' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'cost_per_unit' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Scopes ──

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByType($query, MovementType $movementType)
    {
        return $query->where('movement_type', $movementType);
    }

    public function scopeForCrop($query, int $cropId)
    {
        return $query->where('crop_id', $cropId);
    }

    public function scopeInDateRange($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    public function scopeIncoming($query)
    {
        return $query->where('direction', 'in');
    }

    public function scopeOutgoing($query)
    {
        return $query->where('direction', 'out');
    }
}
