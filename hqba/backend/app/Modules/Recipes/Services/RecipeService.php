<?php

namespace App\Modules\Recipes\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Services\CropService;
use App\Modules\Recipes\Events\RecipePublished;
use App\Modules\Recipes\Models\EspressoRecipe;
use App\Modules\Recipes\Models\EspressoRecipeTrial;
use App\Modules\Recipes\Models\PourOverRecipe;
use App\Modules\Recipes\Models\Recipe;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RecipeService
{
    public function __construct(
        protected CropService $cropService,
    ) {}

    public function list()
    {
        return QueryBuilder::for(Recipe::class)
            ->allowedFilters([
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('recipe_type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('is_current'),
                'recipe_code',
            ])
            ->allowedSorts(['recipe_code', 'created_at', 'version', 'status'])
            ->allowedIncludes(['crop', 'createdBy', 'approvedBy', 'espressoRecipe', 'pourOverRecipe', 'espressoTrials'])
            ->where('is_current', true)
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Recipe
    {
        $crop = Crop::findOrFail($data['crop_id']);
        $countryCode = strtoupper(substr($crop->origin_country, 0, 3));
        $type = $data['recipe_type'] === 'espresso' ? 'ESP' : 'PO';

        $data['recipe_code'] = Recipe::generateRecipeCode($type, $countryCode, $crop->id);
        $data['version'] = 1;
        $data['is_current'] = true;
        $data['status'] = 'draft';

        return Recipe::create($data);
    }

    public function update(Recipe $recipe, array $data): Recipe
    {
        $recipe->update($data);

        return $recipe->fresh();
    }

    public function delete(Recipe $recipe): void
    {
        $recipe->delete();
    }

    public function createNewVersion(Recipe $recipe): Recipe
    {
        // Mark old as not current
        $recipe->update(['is_current' => false]);

        // Clone with incremented version
        $newRecipe = $recipe->replicate(['id', 'created_at', 'updated_at', 'approved_at', 'published_at']);
        $newRecipe->version = $recipe->version + 1;
        $newRecipe->parent_recipe_id = $recipe->id;
        $newRecipe->is_current = true;
        $newRecipe->status = 'draft';
        $newRecipe->approved_by = null;
        $newRecipe->approved_at = null;
        $newRecipe->published_at = null;
        $newRecipe->save();

        return $newRecipe;
    }

    public function addTrial(Recipe $recipe, array $data): EspressoRecipeTrial
    {
        $data['recipe_id'] = $recipe->id;
        $data['trial_number'] = $recipe->espressoTrials()->max('trial_number') + 1;

        // Calculate extraction % if TDS provided
        if (! empty($data['tds']) && ! empty($data['dose']) && ! empty($data['yield'])) {
            $data['extraction_percent'] = round(($data['yield'] / $data['dose']) * ($data['tds'] / 0.18), 2);
        }

        $trial = EspressoRecipeTrial::create($data);

        // Move recipe to calibrating status
        if ($recipe->status->value === 'draft') {
            $recipe->update(['status' => 'calibrating']);
        }

        return $trial;
    }

    public function selectBestShot(Recipe $recipe, int $trialId): Recipe
    {
        // Deselect all
        $recipe->espressoTrials()->update(['is_best_shot' => false]);

        // Select the chosen one
        $bestTrial = $recipe->espressoTrials()->findOrFail($trialId);
        $bestTrial->update(['is_best_shot' => true]);

        // Create/update the final EspressoRecipe from best shot
        EspressoRecipe::updateOrCreate(
            ['recipe_id' => $recipe->id],
            [
                'dose' => $bestTrial->dose,
                'grind_setting' => $bestTrial->grind_setting,
                'extraction_time' => $bestTrial->extraction_time,
                'yield' => $bestTrial->yield,
                'tds' => $bestTrial->tds ?? 0,
                'extraction_percent' => $bestTrial->extraction_percent ?? 0,
            ],
        );

        // Move to pending approval
        $recipe->update(['status' => 'pending_approval']);

        return $recipe->fresh(['espressoRecipe', 'espressoTrials']);
    }

    public function savePourOver(Recipe $recipe, array $data): PourOverRecipe
    {
        $pourOver = PourOverRecipe::updateOrCreate(
            ['recipe_id' => $recipe->id],
            $data,
        );

        if ($recipe->status->value === 'draft') {
            $recipe->update(['status' => 'pending_approval']);
        }

        return $pourOver;
    }

    public function approve(Recipe $recipe, int $approverId): Recipe
    {
        $recipe->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);

        return $recipe->fresh();
    }

    public function publish(Recipe $recipe): Recipe
    {
        $recipe->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        RecipePublished::dispatch($recipe);

        // Check if crop should advance to production_ready
        $crop = $recipe->crop;
        if ($crop->status->value === 'marketing') {
            // Check if all needed recipes exist and are published
            $this->cropService->advanceStatus($crop, 'production_ready');
        }

        return $recipe->fresh();
    }

    public function show(Recipe $recipe): Recipe
    {
        return $recipe->load([
            'crop', 'createdBy', 'approvedBy',
            'espressoTrials', 'espressoRecipe', 'pourOverRecipe',
            'parentRecipe', 'childVersions',
        ]);
    }
}
