<?php

namespace App\Modules\Production\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Enums\RoastLevel;
use App\Modules\Production\Enums\RoastBatchStatus;
use App\Modules\Quality\Models\WasteRecord;
use App\Modules\Recipes\Models\Recipe;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class RoastBatch extends Model
{
    use LogsActivity;

    protected $fillable = [
        'batch_number',
        'crop_id',
        'recipe_id',
        'roaster_id',
        'status',
        'queue_position',
        'is_priority',
        'green_weight_kg',
        'roasted_weight_kg',
        'roast_loss_kg',
        'roast_loss_percent',
        'target_charge_temp',
        'target_first_crack_time',
        'target_first_crack_temp',
        'target_development_time',
        'target_drop_temp',
        'target_total_time',
        'target_roast_level',
        'actual_charge_temp',
        'actual_first_crack_time',
        'actual_first_crack_temp',
        'actual_development_time',
        'actual_development_percent',
        'actual_drop_temp',
        'actual_total_time',
        'actual_roast_level',
        'roast_curve_data',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => RoastBatchStatus::class,
            'target_roast_level' => RoastLevel::class,
            'actual_roast_level' => RoastLevel::class,
            'roast_curve_data' => 'array',
            'is_priority' => 'boolean',
            'green_weight_kg' => 'decimal:2',
            'roasted_weight_kg' => 'decimal:2',
            'roast_loss_kg' => 'decimal:2',
            'roast_loss_percent' => 'decimal:2',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'roasted_weight_kg', 'roast_loss_percent'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    public function roaster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'roaster_id');
    }

    public function wasteRecord(): MorphOne
    {
        return $this->morphOne(WasteRecord::class, 'source');
    }

    public function qualityChecks(): HasMany
    {
        return $this->hasMany(RoastQualityCheck::class);
    }

    // ── Scopes ──

    public function scopeQueued($query)
    {
        return $query->where('status', RoastBatchStatus::Queued)
            ->orderBy('is_priority', 'desc')
            ->orderBy('queue_position');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            RoastBatchStatus::Queued,
            RoastBatchStatus::Roasting,
            RoastBatchStatus::Cooling,
            RoastBatchStatus::PendingQc,
        ]);
    }

    // ── Helpers ──

    public function calculateRoastLoss(): void
    {
        if ($this->green_weight_kg && $this->roasted_weight_kg) {
            $this->roast_loss_kg = $this->green_weight_kg - $this->roasted_weight_kg;
            $this->roast_loss_percent = ($this->roast_loss_kg / $this->green_weight_kg) * 100;
        }
    }

    public static function generateBatchNumber(): string
    {
        $year = now()->year;
        $last = static::where('batch_number', 'like', "RB-{$year}-%")
            ->orderByDesc('batch_number')
            ->first();
        $next = $last ? (int) substr($last->batch_number, -4) + 1 : 1;

        return sprintf('RB-%d-%04d', $year, $next);
    }

    /**
     * Load target profile from the crop's selected trial roast.
     */
    public function loadTargetProfile(): void
    {
        $selectedTrial = $this->crop->trialRoasts()
            ->where('status', 'selected')
            ->first();

        if ($selectedTrial) {
            $this->target_charge_temp = $selectedTrial->charge_temp;
            $this->target_first_crack_time = $selectedTrial->first_crack_time;
            $this->target_first_crack_temp = $selectedTrial->first_crack_temp;
            $this->target_development_time = $selectedTrial->development_time;
            $this->target_drop_temp = $selectedTrial->drop_temp;
            $this->target_total_time = $selectedTrial->total_roast_time;
            $this->target_roast_level = $selectedTrial->roast_level;
        }
    }
}
