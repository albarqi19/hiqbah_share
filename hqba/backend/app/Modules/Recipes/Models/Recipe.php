<?php

namespace App\Modules\Recipes\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Recipes\Enums\RecipeStatus;
use App\Modules\Recipes\Enums\RecipeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Recipe extends Model
{
    use LogsActivity;

    protected $fillable = [
        'crop_id',
        'recipe_code',
        'recipe_type',
        'version',
        'parent_recipe_id',
        'is_current',
        'created_by',
        'status',
        'approved_by',
        'approved_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'recipe_type' => RecipeType::class,
            'status' => RecipeStatus::class,
            'is_current' => 'boolean',
            'approved_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['recipe_code', 'status', 'version'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function parentRecipe(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_recipe_id');
    }

    public function espressoTrials(): HasMany
    {
        return $this->hasMany(EspressoRecipeTrial::class);
    }

    public function childVersions(): HasMany
    {
        return $this->hasMany(self::class, 'parent_recipe_id');
    }

    public function espressoRecipe(): HasOne
    {
        return $this->hasOne(EspressoRecipe::class);
    }

    public function pourOverRecipe(): HasOne
    {
        return $this->hasOne(PourOverRecipe::class);
    }

    // ── Scopes ──

    public function scopeCurrentVersion($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeOfType($query, RecipeType $type)
    {
        return $query->where('recipe_type', $type);
    }

    // ── Helpers ──

    public static function generateRecipeCode(string $type, string $origin, int $cropId): string
    {
        $prefix = strtoupper(substr($type, 0, 3));
        $originCode = strtoupper(substr($origin, 0, 3));

        return sprintf('%s-%s-%04d', $prefix, $originCode, $cropId);
    }
}
