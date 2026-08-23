<?php

namespace App\Modules\Orders\Models;

use App\Core\Models\User;
use App\Modules\Orders\Enums\ShipmentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Shipment extends Model
{
    use LogsActivity;

    protected $fillable = [
        'shipment_number',
        'order_id',
        'status',
        'shipping_address',
        'shipping_city',
        'carrier',
        'tracking_number',
        'notes',
        'created_by',
        'shipped_at',
        'delivered_at',
        'delivery_confirmation',
    ];

    protected function casts(): array
    {
        return [
            'status' => ShipmentStatus::class,
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'tracking_number'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ShipmentItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Static Methods ──

    public static function generateShipmentNumber(): string
    {
        $year = now()->year;
        $last = static::where('shipment_number', 'like', "SHP-{$year}-%")
            ->orderByDesc('shipment_number')
            ->first();
        $next = $last ? (int) substr($last->shipment_number, -4) + 1 : 1;

        return sprintf('SHP-%d-%04d', $year, $next);
    }
}
