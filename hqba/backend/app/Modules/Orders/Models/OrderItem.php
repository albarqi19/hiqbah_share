<?php

namespace App\Modules\Orders\Models;

use App\Modules\Crops\Models\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'crop_id', 'item_type', 'product_name',
        'quantity', 'quantity_allocated', 'quantity_shipped',
        'unit_price', 'total_price', 'discount_amount', 'final_price',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(StockAllocation::class);
    }

    public function shipmentItems(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    // ── Helpers ──

    public function isFullyAllocated(): bool
    {
        return $this->quantity_allocated >= $this->quantity;
    }

    public function isFullyShipped(): bool
    {
        return $this->quantity_shipped >= $this->quantity;
    }

    public function remainingToShip(): int
    {
        return max(0, $this->quantity - $this->quantity_shipped);
    }

    public function remainingToAllocate(): int
    {
        return max(0, $this->quantity - $this->quantity_allocated);
    }
}
