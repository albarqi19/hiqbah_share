<?php

namespace App\Modules\Crops\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCuppingSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trial_roast_id' => ['required', 'exists:trial_roasts,id'],
            'grader_id' => ['required', 'exists:users,id'],
            'scheduled_date' => ['required', 'date'],
            'cups_count' => ['required', 'integer', 'min:1'],
            'dose_per_cup' => ['required', 'numeric', 'min:1'],
            'sample_number' => ['nullable', 'integer', 'min:1'],
            'is_blind_cupping' => ['nullable', 'boolean'],
            // SCA Scores (all optional, 0-10 scale)
            'fragrance' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'aroma' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'flavor' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'aftertaste' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'acidity' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'body' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'balance' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'sweetness' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'uniformity' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'clean_cup' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'overall_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            // Defects
            'defects' => ['nullable', 'integer', 'min:0'],
            'defect_intensity' => ['nullable', 'integer', 'min:0'],
            'defect_type' => ['nullable', 'string'],
            // Other
            'flavor_notes' => ['nullable', 'array'],
            'flavor_notes.*' => ['string'],
            'description' => ['nullable', 'string'],
            'brew_recommendations' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ];
    }
}
