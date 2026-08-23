<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkSetPriceListItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.crop_id' => ['required', 'exists:crops,id'],
            'items.*.item_type' => ['required', Rule::enum(ItemType::class)],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.min_quantity' => ['sometimes', 'numeric', 'min:1'],
            'items.*.effective_from' => ['nullable', 'date'],
            'items.*.effective_until' => ['nullable', 'date', 'after:items.*.effective_from'],
        ];
    }
}
