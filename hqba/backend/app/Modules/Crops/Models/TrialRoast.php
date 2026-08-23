<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\RoastLevel;
use App\Modules\Crops\Enums\TrialRoastStatus;
use App\Modules\Crops\Enums\UsageType;
use App\Modules\Quality\Models\WasteRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TrialRoast extends Model
{
    use LogsActivity;

    protected $fillable = [
        'crop_id',
        'green_coffee_lot_id',
        'roaster_id',
        'trial_number',
        'sample_weight_grams',
        'roasted_weight_grams',
        'roast_loss_grams',
        'roast_loss_percent',
        'charge_temp',
        'drying_time',
        'maillard_time',
        'first_crack_time',
        'first_crack_temp',
        'development_time',
        'development_percent',
        'drop_temp',
        'total_roast_time',
        'roast_curve_data',
        'roast_level',
        'usage_type',
        'notes',
        'status',
        'roasted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => TrialRoastStatus::class,
            'roast_level' => RoastLevel::class,
            'usage_type' => UsageType::class,
            'roast_curve_data' => 'array',
            'roasted_at' => 'datetime',
            'sample_weight_grams' => 'decimal:2',
            'roasted_weight_grams' => 'decimal:2',
            'roast_loss_grams' => 'decimal:2',
            'roast_loss_percent' => 'decimal:2',
            'charge_temp' => 'decimal:1',
            'first_crack_temp' => 'decimal:1',
            'development_percent' => 'decimal:2',
            'drop_temp' => 'decimal:1',
            // drying_time, maillard_time, first_crack_time, development_time, total_roast_time
            // are varchar (e.g. "4:30") — no decimal cast
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['trial_number', 'status', 'roast_level'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function greenCoffeeLot(): BelongsTo
    {
        return $this->belongsTo(GreenCoffeeLot::class);
    }

    public function roaster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'roaster_id');
    }

    public function cuppingSessions(): HasMany
    {
        return $this->hasMany(CuppingSession::class);
    }

    public function wasteRecord(): MorphOne
    {
        return $this->morphOne(WasteRecord::class, 'source');
    }

    // ── Helpers ──

    public function calculateRoastLoss(): void
    {
        $this->roast_loss_grams = $this->sample_weight_grams - $this->roasted_weight_grams;

        if ($this->sample_weight_grams > 0) {
            $this->roast_loss_percent = ($this->roast_loss_grams / $this->sample_weight_grams) * 100;
        }
    }
}
