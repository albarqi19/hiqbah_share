<?php

namespace App\Modules\Crops\Requests;

use App\Modules\Crops\Enums\RoastLevel;
use App\Modules\Crops\Enums\UsageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTrialRoastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'green_coffee_lot_id' => ['required', 'exists:green_coffee_lots,id'],
            'roaster_id' => ['required', 'exists:users,id'],
            'sample_weight_grams' => ['required', 'numeric', 'min:1'],
            'roasted_weight_grams' => ['nullable', 'numeric', 'min:0'],
            'charge_temp' => ['nullable', 'numeric'],
            'drying_time' => ['nullable', 'numeric'],
            'maillard_time' => ['nullable', 'numeric'],
            'first_crack_time' => ['nullable', 'numeric'],
            'first_crack_temp' => ['nullable', 'numeric'],
            'development_time' => ['nullable', 'numeric'],
            'development_percent' => ['nullable', 'numeric'],
            'drop_temp' => ['nullable', 'numeric'],
            'total_roast_time' => ['nullable', 'numeric'],
            'roast_curve_data' => ['nullable', 'array'],
            'roast_level' => ['nullable', Rule::enum(RoastLevel::class)],
            'usage_type' => ['nullable', Rule::enum(UsageType::class)],
            'notes' => ['nullable', 'string'],
            'roasted_at' => ['nullable', 'date'],
        ];
    }
}
