<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Pricing\Enums\DiscountCalculation;
use App\Modules\Pricing\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:discounts,code'],
            'type' => ['required', Rule::enum(DiscountType::class)],
            'calculation' => ['required', Rule::enum(DiscountCalculation::class)],
            'value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'price_list_id' => ['nullable', 'exists:price_lists,id'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after:valid_from'],
        ];
    }
}
