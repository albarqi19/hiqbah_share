<?php

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRoastBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'exists:crops,id'],
            'recipe_id' => ['nullable', 'exists:recipes,id'],
            'roaster_id' => ['required', 'exists:users,id'],
            'green_weight_kg' => ['required', 'numeric', 'min:0.1'],
            'is_priority' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
