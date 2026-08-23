<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SetPriceListItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'exists:crops,id'],
            'item_type' => ['required', Rule::enum(ItemType::class)],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'min_quantity' => ['sometimes', 'numeric', 'min:1'],
            'effective_from' => ['nullable', 'date'],
            'effective_until' => ['nullable', 'date', 'after:effective_from'],
            'change_reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
