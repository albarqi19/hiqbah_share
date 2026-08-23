<?php

namespace App\Modules\Crops\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGreenCoffeeLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'exists:crops,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'bags_count' => ['required', 'integer', 'min:1'],
            'expected_weight' => ['required', 'numeric', 'min:0'],
            'actual_weight' => ['required', 'numeric', 'min:0'],
            'arrival_date' => ['required', 'date'],
            'received_by' => ['required', 'exists:users,id'],
            'barcode' => ['nullable', 'string', 'max:255'],
            'qr_code' => ['nullable', 'string', 'max:255'],
            'shipping_document' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
