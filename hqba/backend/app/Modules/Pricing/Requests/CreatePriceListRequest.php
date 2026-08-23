<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Pricing\Enums\PriceListType;
use App\Modules\Pricing\Enums\RoundingRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePriceListRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:price_lists,code'],
            'type' => ['required', Rule::enum(PriceListType::class)],
            'currency' => ['sometimes', 'string', 'size:3'],
            'is_default' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'rounding_rule' => ['sometimes', Rule::enum(RoundingRule::class)],
        ];
    }
}
