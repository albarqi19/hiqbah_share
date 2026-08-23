<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Pricing\Enums\DiscountCalculation;
use App\Modules\Pricing\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('discounts', 'code')->ignore($this->route('discount'))],
            'type' => ['sometimes', Rule::enum(DiscountType::class)],
            'calculation' => ['sometimes', Rule::enum(DiscountCalculation::class)],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'price_list_id' => ['nullable', 'exists:price_lists,id'],
            'is_active' => ['sometimes', 'boolean'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after:valid_from'],
        ];
    }
}
