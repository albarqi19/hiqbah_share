<?php

namespace App\Modules\Branch\Models;

use App\Core\Models\Branch;
use App\Core\Models\Equipment;
use App\Core\Models\User;
use App\Modules\Branch\Enums\CalibrationStatus;
use App\Modules\Crops\Models\Crop;
use App\Modules\Quality\Models\WasteRecord;
use App\Modules\Recipes\Models\Recipe;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class CalibrationSession extends Model
{
    use LogsActivity;

    protected $fillable = [
        'branch_id', 'equipment_machine_id', 'equipment_grinder_id',
        'crop_id', 'recipe_id', 'barista_id', 'status',
        'total_shots', 'total_dose_grams', 'total_waste_grams',
        'approved_by', 'approved_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => CalibrationStatus::class,
            'total_dose_grams' => 'decimal:2',
            'total_waste_grams' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status', 'total_shots'])->logOnlyDirty();
    }

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function machine(): BelongsTo { return $this->belongsTo(Equipment::class, 'equipment_machine_id'); }
    public function grinder(): BelongsTo { return $this->belongsTo(Equipment::class, 'equipment_grinder_id'); }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function recipe(): BelongsTo { return $this->belongsTo(Recipe::class); }
    public function barista(): BelongsTo { return $this->belongsTo(User::class, 'barista_id'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function shots(): HasMany { return $this->hasMany(CalibrationShot::class)->orderBy('shot_number'); }
    public function wasteRecord(): MorphOne { return $this->morphOne(WasteRecord::class, 'source'); }

    public function recalculate(): void
    {
        $shots = $this->shots;
        $this->total_shots = $shots->count();
        $this->total_dose_grams = $shots->sum('dose') + $shots->sum('yield');
        $this->total_waste_grams = $this->total_dose_grams; // all shots become waste
    }
}
