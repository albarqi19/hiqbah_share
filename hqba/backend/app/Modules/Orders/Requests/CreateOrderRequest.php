<?php

namespace App\Modules\Orders\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'notes' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'shipping_city' => ['nullable', 'string'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'vat_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.crop_id' => ['required', 'exists:crops,id'],
            'items.*.item_type' => ['required', 'in:finished_250,finished_500,finished_1kg'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
