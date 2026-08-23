<?php

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateQualityCheckRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'inspector_id' => ['required', 'exists:users,id'],
            'sample_weight_grams' => ['nullable', 'numeric', 'min:1'],
            'color_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'aroma_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'flavor_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'acidity_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'body_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'balance_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
