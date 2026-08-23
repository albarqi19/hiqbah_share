<?php

namespace App\Modules\Recipes\Requests;

use App\Modules\Recipes\Enums\BrewType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePourOverRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dose' => ['required', 'numeric', 'min:1'],
            'grind_setting' => ['required', 'string'],
            'brew_type' => ['required', Rule::enum(BrewType::class)],
            'bloom_time' => ['required', 'integer', 'min:1'],
            'bloom_water' => ['required', 'numeric', 'min:1'],
            'pours' => ['required', 'array', 'min:1'],
            'pours.*.pour' => ['required', 'integer'],
            'pours.*.water' => ['required', 'numeric'],
            'total_water' => ['required', 'numeric', 'min:1'],
            'total_time' => ['required', 'integer', 'min:1'],
        ];
    }
}
