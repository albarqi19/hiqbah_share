<?php

namespace App\Modules\Procurement\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\GreenCoffeeLot;
use App\Modules\Procurement\Enums\PurchaseOrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PurchaseOrder extends Model
{
    use LogsActivity;

    protected $fillable = [
        'po_number',
        'supplier_id',
        'origin_country',
        'region',
        'farm',
        'process',
        'variety',
        'altitude',
        'quantity_kg',
        'price_per_kg',
        'shipping_cost',
        'customs_cost',
        'total_cost',
        'currency',
        'expected_date',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => PurchaseOrderStatus::class,
            'quantity_kg' => 'decimal:2',
            'price_per_kg' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'customs_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'expected_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['po_number', 'status', 'supplier_id', 'total_cost'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }

    public function greenCoffeeLots(): HasMany
    {
        return $this->hasMany(GreenCoffeeLot::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function requisitions(): HasMany
    {
        return $this->hasMany(PurchaseRequisition::class, 'converted_to_po_id');
    }

    public function goodsReceiptNotes(): HasMany
    {
        return $this->hasMany(GoodsReceiptNote::class);
    }

    // ── Scopes ──

    public function scopeStatus($query, PurchaseOrderStatus $status)
    {
        return $query->where('status', $status);
    }

    // ── Helpers ──

    public static function generatePoNumber(): string
    {
        $year = now()->year;
        $lastPo = static::where('po_number', 'like', "PO-{$year}-%")
            ->orderByDesc('po_number')
            ->first();

        $nextNumber = 1;
        if ($lastPo) {
            $lastNumber = (int) substr($lastPo->po_number, -3);
            $nextNumber = $lastNumber + 1;
        }

        return sprintf('PO-%d-%03d', $year, $nextNumber);
    }

    public function calculateTotalCost(): void
    {
        // Prefer items if they exist (new model), else fall back to legacy fields.
        if ($this->relationLoaded('items') ? $this->items->isNotEmpty() : $this->items()->exists()) {
            $itemsSubtotal = (float) $this->items()->sum('subtotal');
        } else {
            $itemsSubtotal = (float) $this->quantity_kg * (float) $this->price_per_kg;
        }

        $this->total_cost = $itemsSubtotal
            + (float) $this->shipping_cost
            + (float) $this->customs_cost;
    }
}
