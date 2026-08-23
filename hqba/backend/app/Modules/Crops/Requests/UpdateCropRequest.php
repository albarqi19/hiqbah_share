<?php

namespace App\Modules\Crops\Requests;

use App\Modules\Crops\Enums\CropStatus;
use App\Modules\Crops\Enums\UsageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'serial_number' => ['sometimes', 'string', 'max:50', Rule::unique('crops', 'serial_number')->ignore($this->route('crop'))],
            'purchase_order_id' => ['sometimes', 'exists:purchase_orders,id'],
            'supplier_id' => ['sometimes', 'exists:suppliers,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'origin_country' => ['sometimes', 'string', 'max:100'],
            'region' => ['sometimes', 'string', 'max:255'],
            'farm' => ['nullable', 'string', 'max:255'],
            'process' => ['sometimes', 'string', 'max:100'],
            'variety' => ['nullable', 'string', 'max:255'],
            'altitude' => ['nullable', 'string', 'max:100'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', Rule::enum(CropStatus::class)],
            'total_green_weight' => ['sometimes', 'numeric', 'min:0'],
            'remaining_green_weight' => ['sometimes', 'numeric', 'min:0'],
            'usage_type' => ['nullable', Rule::enum(UsageType::class)],
            'flavor_notes' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'brew_recommendations' => ['nullable', 'string'],
        ];
    }
}
