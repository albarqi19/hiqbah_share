<?php

namespace App\Modules\Pricing\Requests;

use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SimulateMarginRequest extends FormRequest
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
            'new_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
