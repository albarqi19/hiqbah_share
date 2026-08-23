<?php

namespace App\Modules\Production\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\InspectionDecision;
use App\Modules\Quality\Models\WasteRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class RoastQualityCheck extends Model
{
    use LogsActivity;

    protected $fillable = [
        'roast_batch_id', 'inspector_id', 'sample_weight_grams',
        'color_score', 'aroma_score', 'flavor_score', 'acidity_score',
        'body_score', 'balance_score', 'total_score',
        'decision', 'rejection_reason', 'corrective_action', 'notes', 'checked_at',
    ];

    protected function casts(): array
    {
        return [
            'decision' => InspectionDecision::class,
            'sample_weight_grams' => 'decimal:2',
            'total_score' => 'decimal:1',
            'checked_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['decision', 'total_score'])->logOnlyDirty();
    }

    public function roastBatch(): BelongsTo { return $this->belongsTo(RoastBatch::class); }
    public function inspector(): BelongsTo { return $this->belongsTo(User::class, 'inspector_id'); }
    public function wasteRecord(): MorphOne { return $this->morphOne(WasteRecord::class, 'source'); }

    public function calculateTotalScore(): void
    {
        $scores = array_filter([
            $this->color_score, $this->aroma_score, $this->flavor_score,
            $this->acidity_score, $this->body_score, $this->balance_score,
        ], fn ($v) => $v !== null);
        $count = count($scores);
        $this->total_score = $count > 0 ? (array_sum($scores) / $count) * 10 : 0;
    }
}
