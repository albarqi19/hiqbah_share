<?php

namespace App\Modules\Orders\Models;

use App\Core\Models\User;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Pricing\Models\Discount;
use App\Modules\Pricing\Models\PriceList;
use App\Modules\Sales\Models\Commission;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Order extends Model
{
    use LogsActivity;

    protected $fillable = [
        'order_number', 'customer_id', 'created_by', 'sales_rep_id', 'price_list_id',
        'status',
        'subtotal', 'vat_percent', 'vat_amount', 'discount', 'discount_id', 'discount_code', 'total',
        'payment_method', 'payment_status', 'payment_terms', 'payment_due_date', 'paid_at',
        'shipping_address', 'shipping_city', 'shipped_at',
        'delivered_at', 'delivery_notes',
        'notes', 'internal_notes',
        'quote_number', 'quote_generated_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'quote_generated_at' => 'datetime',
            'payment_due_date' => 'date',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'total', 'payment_status'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    public function discountRelation(): BelongsTo
    {
        return $this->belongsTo(Discount::class, 'discount_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(StockAllocation::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function commission(): HasOne
    {
        return $this->hasOne(Commission::class);
    }

    // ── Scopes ──

    public function scopeByStatus($query, OrderStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeOverduePayments($query)
    {
        return $query->where('payment_status', '!=', 'paid')
            ->whereNotNull('payment_due_date')
            ->where('payment_due_date', '<', now()->toDateString())
            ->whereNotIn('status', [OrderStatus::Cancelled->value, OrderStatus::Closed->value]);
    }

    // ── Static Methods ──

    public static function generateOrderNumber(): string
    {
        $year = now()->year;
        $last = static::where('order_number', 'like', "ORD-{$year}-%")
            ->orderByDesc('order_number')
            ->first();
        $next = $last ? (int) substr($last->order_number, -4) + 1 : 1;

        return sprintf('ORD-%d-%04d', $year, $next);
    }

    public static function generateQuoteNumber(): string
    {
        $year = now()->year;
        $last = static::where('quote_number', 'like', "QOT-{$year}-%")
            ->orderByDesc('quote_number')
            ->first();
        $next = $last ? (int) substr($last->quote_number, -4) + 1 : 1;

        return sprintf('QOT-%d-%04d', $year, $next);
    }

    // ── Business Logic ──

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum('total_price');
        $this->vat_amount = $this->subtotal * ($this->vat_percent / 100);
        $this->total = $this->subtotal + $this->vat_amount - $this->discount;
    }

    public function isFullyShipped(): bool
    {
        return $this->items->every(fn (OrderItem $item) => $item->isFullyShipped());
    }

    public function isPartiallyShipped(): bool
    {
        $hasShipped = $this->items->contains(fn (OrderItem $item) => $item->quantity_shipped > 0);
        $hasUnshipped = $this->items->contains(fn (OrderItem $item) => ! $item->isFullyShipped());

        return $hasShipped && $hasUnshipped;
    }

    public function isPaymentOverdue(): bool
    {
        return $this->payment_status !== 'paid'
            && $this->payment_due_date
            && $this->payment_due_date->lt(now());
    }
}
