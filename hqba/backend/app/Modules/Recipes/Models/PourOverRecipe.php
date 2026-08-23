<?php

namespace App\Modules\Recipes\Models;

use App\Modules\Recipes\Enums\BrewType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PourOverRecipe extends Model
{
    protected $fillable = [
        'recipe_id',
        'dose',
        'grind_setting',
        'brew_type',
        'bloom_time',
        'bloom_water',
        'pours',
        'total_water',
        'total_time',
    ];

    protected function casts(): array
    {
        return [
            'brew_type' => BrewType::class,
            'pours' => 'array',
            'dose' => 'decimal:1',
            'bloom_water' => 'decimal:1',
            'total_water' => 'decimal:1',
        ];
    }

    // ── Relationships ──

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
