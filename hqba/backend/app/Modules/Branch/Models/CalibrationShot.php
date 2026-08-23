<?php

namespace App\Modules\Branch\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalibrationShot extends Model
{
    public $timestamps = false;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'calibration_session_id', 'shot_number',
        'dose', 'grind_setting', 'extraction_time', 'yield',
        'tds', 'extraction_percent',
        'acidity_score', 'finish_score', 'balance_score',
        'is_within_range', 'notes', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'dose' => 'decimal:2',
            'yield' => 'decimal:2',
            'tds' => 'decimal:2',
            'extraction_percent' => 'decimal:2',
            'is_within_range' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo { return $this->belongsTo(CalibrationSession::class, 'calibration_session_id'); }

    /**
     * Check if shot is within acceptable range of target recipe.
     */
    public function checkRange(?float $targetTds, ?int $targetTime): void
    {
        $tdsOk = $targetTds === null || abs((float)$this->tds - $targetTds) <= 0.5;
        $timeOk = $targetTime === null || abs($this->extraction_time - $targetTime) <= 3;
        $this->is_within_range = $tdsOk && $timeOk;
    }
}
