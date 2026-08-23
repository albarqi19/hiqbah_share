<?php

namespace App\Modules\Recipes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EspressoRecipeTrial extends Model
{
    protected $fillable = [
        'recipe_id',
        'trial_number',
        'dose',
        'grind_setting',
        'extraction_time',
        'yield',
        'tds',
        'extraction_percent',
        'acidity',
        'finish',
        'balance',
        'is_best_shot',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_best_shot' => 'boolean',
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
