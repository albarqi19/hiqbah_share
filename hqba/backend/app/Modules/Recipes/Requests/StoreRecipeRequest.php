<?php

namespace App\Modules\Recipes\Requests;

use App\Modules\Recipes\Enums\RecipeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'exists:crops,id'],
            'recipe_type' => ['required', Rule::enum(RecipeType::class)],
            'created_by' => ['required', 'exists:users,id'],
        ];
    }
}
