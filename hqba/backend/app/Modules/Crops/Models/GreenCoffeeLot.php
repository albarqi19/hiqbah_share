<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\GreenCoffeeLotStatus;
use App\Modules\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class GreenCoffeeLot extends Model
{
    use LogsActivity;

    protected $fillable = [
        'crop_id',
        'purchase_order_id',
        'batch_id',
        'bags_count',
        'expected_weight',
        'actual_weight',
        'weight_variance',
        'arrival_date',
        'barcode',
        'qr_code',
        'shipping_document',
        'received_by',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => GreenCoffeeLotStatus::class,
            'expected_weight' => 'decimal:2',
            'actual_weight' => 'decimal:2',
            'weight_variance' => 'decimal:2',
            'arrival_date' => 'date',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['batch_id', 'status', 'actual_weight'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(GreenCoffeeInspection::class);
    }

    public function trialRoasts(): HasMany
    {
        return $this->hasMany(TrialRoast::class);
    }

    // ── Helpers ──

    public static function generateBatchId(): string
    {
        $year = now()->year;
        $lastLot = static::where('batch_id', 'like', "GC-{$year}-%")
            ->orderByDesc('batch_id')
            ->first();

        $nextNumber = 1;
        if ($lastLot) {
            $lastNumber = (int) substr($lastLot->batch_id, -3);
            $nextNumber = $lastNumber + 1;
        }

        return sprintf('GC-%d-%03d', $year, $nextNumber);
    }

    public function calculateVariance(): void
    {
        $this->weight_variance = $this->actual_weight - $this->expected_weight;
    }
}
