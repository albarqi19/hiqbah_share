<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\CuppingDecision;
use App\Modules\Crops\Enums\CuppingStatus;
use App\Modules\Quality\Models\WasteRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class CuppingSession extends Model
{
    use LogsActivity;

    protected $fillable = [
        'crop_id',
        'trial_roast_id',
        'grader_id',
        'scheduled_date',
        'cups_count',
        'dose_per_cup',
        'total_coffee_used',
        'fragrance',
        'aroma',
        'flavor',
        'acidity',
        'body',
        'aftertaste',
        'balance',
        'sweetness',
        'overall_score',
        'flavor_notes',
        'description',
        'brew_recommendations',
        'decision',
        'rejection_reason',
        'notes',
        'photos',
        'status',
        'uniformity',
        'clean_cup',
        'defects',
        'defect_type',
        'defect_intensity',
        'total_score_before_defects',
        'final_score',
        'classification',
        'sample_number',
        'is_blind_cupping',
    ];

    protected function casts(): array
    {
        return [
            'status' => CuppingStatus::class,
            'decision' => CuppingDecision::class,
            'flavor_notes' => 'array',
            'photos' => 'array',
            'scheduled_date' => 'date',
            'fragrance' => 'decimal:1',
            'aroma' => 'decimal:1',
            'flavor' => 'decimal:1',
            'acidity' => 'decimal:1',
            'body' => 'decimal:1',
            'aftertaste' => 'decimal:1',
            'balance' => 'decimal:1',
            'sweetness' => 'decimal:1',
            'overall_score' => 'decimal:1',
            'uniformity' => 'decimal:1',
            'clean_cup' => 'decimal:1',
            'total_score_before_defects' => 'decimal:1',
            'final_score' => 'decimal:1',
            'total_coffee_used' => 'decimal:1',
            'is_blind_cupping' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'decision', 'overall_score'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function trialRoast(): BelongsTo
    {
        return $this->belongsTo(TrialRoast::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'grader_id');
    }

    public function wasteRecord(): MorphOne
    {
        return $this->morphOne(WasteRecord::class, 'source');
    }

    // ── Helpers ──

    public function calculateTotalCoffeeUsed(): void
    {
        $this->total_coffee_used = $this->cups_count * $this->dose_per_cup;
    }

    public function calculateFinalScore(): void
    {
        $attributes = [
            $this->fragrance, $this->aroma, $this->flavor, $this->aftertaste,
            $this->acidity, $this->body, $this->balance, $this->uniformity,
            $this->clean_cup, $this->sweetness, $this->overall_score,
        ];

        $total = array_sum(array_filter($attributes, fn ($v) => $v !== null));
        $this->total_score_before_defects = $total;
        $this->final_score = $total - ($this->defects * $this->defect_intensity);

        $this->classification = match (true) {
            $this->final_score >= 90 => 'outstanding',
            $this->final_score >= 85 => 'excellent',
            $this->final_score >= 80 => 'very_good',
            default => 'below_specialty',
        };
    }
}
