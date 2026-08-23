<?php

namespace App\Modules\Orders\Models;

use App\Core\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Orders\Enums\AllocationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAllocation extends Model
{
    protected $fillable = [
        'order_id',
        'order_item_id',
        'inventory_item_id',
        'quantity_allocated',
        'status',
        'allocated_by',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AllocationStatus::class,
            'quantity_allocated' => 'decimal:2',
            'released_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function allocatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'allocated_by');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', AllocationStatus::Reserved);
    }
}
