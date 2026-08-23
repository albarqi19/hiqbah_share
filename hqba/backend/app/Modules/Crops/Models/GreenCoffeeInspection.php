<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\InspectionDecision;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GreenCoffeeInspection extends Model
{
    protected $fillable = [
        'green_coffee_lot_id',
        'inspector_id',
        'moisture_percent',
        'water_activity',
        'density',
        'screen_size',
        'defect_count',
        'defect_notes',
        'visual_notes',
        'decision',
        'rejection_reason',
        'condition_notes',
        'photos',
        'inspected_at',
    ];

    protected function casts(): array
    {
        return [
            'decision' => InspectionDecision::class,
            'moisture_percent' => 'decimal:2',
            'water_activity' => 'decimal:2',
            'density' => 'decimal:2',
            'photos' => 'array',
            'inspected_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function greenCoffeeLot(): BelongsTo
    {
        return $this->belongsTo(GreenCoffeeLot::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }
}
