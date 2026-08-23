<?php

namespace App\Modules\Procurement\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Header
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'customs_cost' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:5'],
            'expected_date' => ['required', 'date', 'after:today'],
            'notes' => ['nullable', 'string'],

            // Items
            'items' => ['required', 'array', 'min:1'],
            'items.*.requisition_id' => ['nullable', 'exists:purchase_requisitions,id'],
            'items.*.origin_country' => ['required', 'string', 'max:100'],
            'items.*.region' => ['required', 'string', 'max:100'],
            'items.*.farm' => ['nullable', 'string', 'max:100'],
            'items.*.process' => ['required', 'string', 'max:50'],
            'items.*.variety' => ['nullable', 'string', 'max:100'],
            'items.*.altitude' => ['nullable', 'string', 'max:50'],
            'items.*.quantity_kg' => ['required', 'numeric', 'min:0.01'],
            'items.*.price_per_kg' => ['required', 'numeric', 'min:0'],
            'items.*.expected_cupping_score' => ['nullable', 'numeric', 'between:0,100'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
