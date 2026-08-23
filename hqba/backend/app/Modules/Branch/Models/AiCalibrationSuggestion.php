<?php

namespace App\Modules\Branch\Models;

use App\Core\Models\Branch;
use App\Core\Models\Equipment;
use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiCalibrationSuggestion extends Model
{
    protected $fillable = [
        'branch_id', 'crop_id', 'equipment_grinder_id', 'equipment_machine_id',
        'suggested_dose', 'suggested_grind', 'suggested_time', 'suggested_yield',
        'confidence', 'reasoning_ar', 'reasoning_en',
        'alerts', 'analysis_data', 'status', 'requested_by',
    ];

    protected function casts(): array
    {
        return [
            'alerts' => 'array',
            'analysis_data' => 'array',
            'suggested_dose' => 'decimal:2',
            'suggested_yield' => 'decimal:2',
            'confidence' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function grinder(): BelongsTo { return $this->belongsTo(Equipment::class, 'equipment_grinder_id'); }
    public function machine(): BelongsTo { return $this->belongsTo(Equipment::class, 'equipment_machine_id'); }
    public function requestedBy(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
}
