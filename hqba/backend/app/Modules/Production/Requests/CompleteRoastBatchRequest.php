<?php

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteRoastBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'roasted_weight_kg' => ['required', 'numeric', 'min:0.01'],
            'actual_charge_temp' => ['nullable', 'numeric'],
            'actual_first_crack_time' => ['nullable', 'string'],
            'actual_first_crack_temp' => ['nullable', 'numeric'],
            'actual_development_time' => ['nullable', 'string'],
            'actual_development_percent' => ['nullable', 'numeric'],
            'actual_drop_temp' => ['nullable', 'numeric'],
            'actual_total_time' => ['nullable', 'string'],
            'actual_roast_level' => ['nullable', 'string', 'in:light,medium_light,medium,medium_dark,dark'],
            'roast_curve_data' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
