<?php

namespace App\Modules\Crops\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePricingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'set_by' => ['required', 'exists:users,id'],
            'green_cost_per_kg' => ['nullable', 'numeric', 'min:0'],
            'roasting_loss_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'roasting_cost_per_kg' => ['nullable', 'numeric', 'min:0'],
            'packaging_cost_per_unit' => ['nullable', 'numeric', 'min:0'],
            'operation_cost_per_kg' => ['nullable', 'numeric', 'min:0'],
            'shipping_cost_per_kg' => ['nullable', 'numeric', 'min:0'],
            'target_margin_percent' => ['nullable', 'numeric', 'min:0'],
            'retail_price_250g' => ['nullable', 'numeric', 'min:0'],
            'retail_price_500g' => ['nullable', 'numeric', 'min:0'],
            'retail_price_1kg' => ['nullable', 'numeric', 'min:0'],
            'wholesale_price_kg' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
