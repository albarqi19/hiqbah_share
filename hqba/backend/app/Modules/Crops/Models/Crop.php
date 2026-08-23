<?php

namespace App\Modules\Crops\Models;

use App\Modules\Crops\Enums\CropStatus;
use App\Modules\Crops\Enums\UsageType;
use App\Modules\Procurement\Models\PurchaseOrder;
use App\Modules\Procurement\Models\Supplier;
use App\Modules\Quality\Models\WasteRecord;
use App\Modules\Recipes\Models\Recipe;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Crop extends Model
{
    use LogsActivity;

    protected $fillable = [
        'serial_number',
        'purchase_order_id',
        'supplier_id',
        'name',
        'name_ar',
        'origin_country',
        'region',
        'farm',
        'process',
        'variety',
        'altitude',
        'lot_number',
        'status',
        'total_green_weight',
        'remaining_green_weight',
        'usage_type',
        'flavor_notes',
        'description',
        'description_ar',
        'brew_recommendations',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => CropStatus::class,
            'usage_type' => UsageType::class,
            'flavor_notes' => 'array',
            'total_green_weight' => 'decimal:2',
            'remaining_green_weight' => 'decimal:2',
            'closed_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['serial_number', 'status', 'name'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function greenCoffeeLots(): HasMany
    {
        return $this->hasMany(GreenCoffeeLot::class);
    }

    public function trialRoasts(): HasMany
    {
        return $this->hasMany(TrialRoast::class);
    }

    public function cuppingSessions(): HasMany
    {
        return $this->hasMany(CuppingSession::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function wasteRecords(): HasMany
    {
        return $this->hasMany(WasteRecord::class);
    }

    public function pricing(): HasOne
    {
        return $this->hasOne(CropPricing::class);
    }

    public function marketing(): HasOne
    {
        return $this->hasOne(CropMarketing::class);
    }

    // ── Scopes ──

    public function scopeStatus($query, CropStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('closed_at');
    }

    // ── Helpers ──

    public static function generateSerialNumber(string $countryCode): string
    {
        $year = now()->year;
        $prefix = "CR-{$year}-{$countryCode}";

        $lastCrop = static::where('serial_number', 'like', "{$prefix}-%")
            ->orderByDesc('serial_number')
            ->first();

        $nextNumber = 1;
        if ($lastCrop) {
            $lastNumber = (int) substr($lastCrop->serial_number, -3);
            $nextNumber = $lastNumber + 1;
        }

        return sprintf('%s-%03d', $prefix, $nextNumber);
    }

    public function localizedName(): string
    {
        return app()->getLocale() === 'ar' ? $this->name_ar : $this->name;
    }

    /**
     * Deduct from remaining green weight.
     * @param float $grams Weight in GRAMS to deduct (will be converted to kg)
     */
    public function deductGreenWeight(float $grams): void
    {
        $kg = $grams / 1000;

        if ($kg > (float) $this->remaining_green_weight) {
            throw new \RuntimeException(
                "Insufficient green weight: need {$kg}kg but only {$this->remaining_green_weight}kg remaining for crop {$this->serial_number}"
            );
        }

        $this->remaining_green_weight -= $kg;
        $this->save();
    }

    /**
     * Deduct from remaining green weight in KG.
     */
    public function deductGreenWeightKg(float $kg): void
    {
        if ($kg > (float) $this->remaining_green_weight) {
            throw new \RuntimeException(
                "Insufficient green weight: need {$kg}kg but only {$this->remaining_green_weight}kg remaining for crop {$this->serial_number}"
            );
        }

        $this->remaining_green_weight -= $kg;
        $this->save();
    }

    public function totalWasteGrams(): float
    {
        return (float) $this->wasteRecords()->sum('weight_grams');
    }
}
