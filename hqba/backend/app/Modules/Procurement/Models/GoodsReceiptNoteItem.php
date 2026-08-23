<?php

namespace App\Modules\Procurement\Models;

use App\Modules\Procurement\Enums\GrnCondition;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptNoteItem extends Model
{
    protected $fillable = [
        'goods_receipt_note_id',
        'purchase_order_item_id',
        'bags_received',
        'weight_received',
        'expected_weight',
        'variance',
        'condition',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'condition' => GrnCondition::class,
            'weight_received' => 'decimal:2',
            'expected_weight' => 'decimal:2',
            'variance' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function goodsReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptNote::class);
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    public function calculateVariance(): void
    {
        $this->variance = (float) $this->weight_received - (float) $this->expected_weight;
    }
}
