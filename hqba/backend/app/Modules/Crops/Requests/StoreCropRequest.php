<?php

namespace App\Modules\Crops\Requests;

use App\Modules\Crops\Enums\CropStatus;
use App\Modules\Crops\Enums\UsageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'serial_number' => ['nullable', 'string', 'max:50', 'unique:crops,serial_number'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'origin_country' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:255'],
            'farm' => ['nullable', 'string', 'max:255'],
            'process' => ['required', 'string', 'max:100'],
            'variety' => ['nullable', 'string', 'max:255'],
            'altitude' => ['nullable', 'string', 'max:100'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', Rule::enum(CropStatus::class)],
            'total_green_weight' => ['nullable', 'numeric', 'min:0'],
            'remaining_green_weight' => ['nullable', 'numeric', 'min:0'],
            'usage_type' => ['nullable', Rule::enum(UsageType::class)],
            'flavor_notes' => ['nullable', 'array'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'brew_recommendations' => ['nullable', 'string'],
        ];
    }
}
