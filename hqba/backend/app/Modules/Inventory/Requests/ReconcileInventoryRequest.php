<?php

namespace App\Modules\Inventory\Requests;

use App\Modules\Inventory\Enums\ItemType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReconcileInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'crop_id' => ['required', 'exists:crops,id'],
            'item_type' => ['required', Rule::enum(ItemType::class)],
            'actual_quantity' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
