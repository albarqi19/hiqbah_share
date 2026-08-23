<?php

namespace App\Modules\Quality\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Quality\Enums\WasteType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WasteRecord extends Model
{
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    const UPDATED_AT = null;

    protected $table = 'waste_records';

    protected $fillable = [
        'crop_id',
        'source_type',
        'source_id',
        'waste_type',
        'weight_grams',
        'reason',
        'created_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'waste_type' => WasteType::class,
            'weight_grams' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Scopes ──

    public function scopeOfType($query, WasteType $wasteType)
    {
        return $query->where('waste_type', $wasteType);
    }

    public function scopeForCrop($query, int $cropId)
    {
        return $query->where('crop_id', $cropId);
    }
}
