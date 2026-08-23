<?php

namespace App\Modules\Inventory\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAuditItem extends Model
{
    protected $fillable = [
        'inventory_audit_id', 'inventory_item_id', 'crop_id', 'item_type',
        'system_quantity', 'actual_quantity', 'variance', 'variance_percent',
        'notes', 'counted_by', 'counted_at',
    ];

    protected function casts(): array
    {
        return [
            'system_quantity' => 'decimal:2', 'actual_quantity' => 'decimal:2',
            'variance' => 'decimal:2', 'variance_percent' => 'decimal:2',
            'counted_at' => 'datetime',
        ];
    }

    public function audit(): BelongsTo { return $this->belongsTo(InventoryAudit::class, 'inventory_audit_id'); }
    public function inventoryItem(): BelongsTo { return $this->belongsTo(InventoryItem::class); }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function counter(): BelongsTo { return $this->belongsTo(User::class, 'counted_by'); }
}
