<?php

namespace App\Modules\Procurement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'requisition_id',
        'origin_country',
        'region',
        'farm',
        'process',
        'variety',
        'altitude',
        'quantity_kg',
        'price_per_kg',
        'subtotal',
        'expected_cupping_score',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_kg' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'expected_cupping_score' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class, 'requisition_id');
    }

    // ── Helpers ──

    public function calculateSubtotal(): void
    {
        $this->subtotal = (float) $this->quantity_kg * (float) $this->price_per_kg;
    }
}
