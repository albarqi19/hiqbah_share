<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Pricing\Enums\PriceListType;
use App\Modules\Pricing\Enums\RoundingRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePriceListRequest extends FormRequest
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
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('price_lists', 'code')->ignore($this->route('priceList'))],
            'type' => ['sometimes', Rule::enum(PriceListType::class)],
            'currency' => ['sometimes', 'string', 'size:3'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'rounding_rule' => ['sometimes', Rule::enum(RoundingRule::class)],
        ];
    }
}
