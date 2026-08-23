<?php

namespace App\Modules\Recipes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EspressoRecipe extends Model
{
    protected $fillable = [
        'recipe_id',
        'dose',
        'grind_setting',
        'extraction_time',
        'yield',
        'tds',
        'extraction_percent',
    ];

    protected function casts(): array
    {
        return [
            'dose' => 'decimal:2',
            'yield' => 'decimal:2',
            'tds' => 'decimal:2',
            'extraction_percent' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
