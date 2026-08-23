<?php

namespace App\Modules\Recipes\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Recipes\Models\Recipe;
use App\Modules\Recipes\Requests\StoreEspressoTrialRequest;
use App\Modules\Recipes\Requests\StorePourOverRecipeRequest;
use App\Modules\Recipes\Requests\StoreRecipeRequest;
use App\Modules\Recipes\Requests\UpdateRecipeRequest;
use App\Modules\Recipes\Resources\EspressoRecipeTrialResource;
use App\Modules\Recipes\Resources\RecipeResource;
use App\Modules\Recipes\Services\RecipeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends ApiController
{
    public function __construct(
        protected RecipeService $recipeService,
    ) {}

    public function index(): JsonResponse
    {
        $recipes = $this->recipeService->list();

        return $this->success(RecipeResource::collection($recipes));
    }

    public function store(StoreRecipeRequest $request): JsonResponse
    {
        $recipe = $this->recipeService->create($request->validated());

        return $this->created(new RecipeResource($recipe));
    }

    public function show(string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $recipe = $this->recipeService->show($recipe);

        return $this->success(new RecipeResource($recipe));
    }

    public function update(UpdateRecipeRequest $request, string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $recipe = $this->recipeService->update($recipe, $request->validated());

        return $this->success(new RecipeResource($recipe));
    }

    public function destroy(string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $this->recipeService->delete($recipe);

        return $this->noContent();
    }

    public function addTrial(StoreEspressoTrialRequest $request, string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $trial = $this->recipeService->addTrial($recipe, $request->validated());

        return $this->created(new EspressoRecipeTrialResource($trial));
    }

    public function selectBestShot(Request $request, string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $request->validate(['trial_id' => 'required|exists:espresso_recipe_trials,id']);
        $recipe = $this->recipeService->selectBestShot($recipe, $request->trial_id);

        return $this->success(new RecipeResource($recipe));
    }

    public function savePourOver(StorePourOverRecipeRequest $request, string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $pourOver = $this->recipeService->savePourOver($recipe, $request->validated());

        return $this->success($pourOver);
    }

    public function createVersion(string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $newRecipe = $this->recipeService->createNewVersion($recipe);

        return $this->created(new RecipeResource($newRecipe));
    }

    public function approve(string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $recipe = $this->recipeService->approve($recipe, auth()->id());

        return $this->success(new RecipeResource($recipe));
    }

    public function publish(string $recipe): JsonResponse
    {
        $recipe = Recipe::findOrFail($recipe);
        $recipe = $this->recipeService->publish($recipe);

        return $this->success(new RecipeResource($recipe));
    }
}
