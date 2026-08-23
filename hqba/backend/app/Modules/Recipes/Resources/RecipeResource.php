<?php

namespace App\Modules\Recipes\Resources;

use App\Core\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'recipe_code' => $this->recipe_code,
            'recipe_type' => $this->recipe_type,
            'version' => $this->version,
            'parent_recipe_id' => $this->parent_recipe_id,
            'is_current' => $this->is_current,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at,
            'published_at' => $this->published_at,
            'crop' => $this->whenLoaded('crop', fn () => [
                'id' => $this->crop->id,
                'serial_number' => $this->crop->serial_number,
                'name' => $this->crop->name,
                'name_ar' => $this->crop->name_ar,
            ]),
            'created_by_user' => $this->whenLoaded('createdBy', fn () => new UserResource($this->createdBy)),
            'approved_by_user' => $this->whenLoaded('approvedBy', fn () => new UserResource($this->approvedBy)),
            'espresso_trials' => EspressoRecipeTrialResource::collection($this->whenLoaded('espressoTrials')),
            'espresso_recipe' => $this->whenLoaded('espressoRecipe'),
            'pour_over_recipe' => $this->whenLoaded('pourOverRecipe'),
            'parent_recipe' => $this->whenLoaded('parentRecipe', fn () => [
                'id' => $this->parentRecipe->id,
                'version' => $this->parentRecipe->version,
                'recipe_code' => $this->parentRecipe->recipe_code,
            ]),
            'child_versions_count' => $this->whenCounted('childVersions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
