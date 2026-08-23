<?php

namespace App\Modules\Procurement\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Header
            'supplier_id' => ['sometimes', 'exists:suppliers,id'],
            'shipping_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'customs_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:5'],
            'expected_date' => ['sometimes', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],

            // Items: full replacement when provided
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.requisition_id' => ['nullable', 'exists:purchase_requisitions,id'],
            'items.*.origin_country' => ['required_with:items', 'string', 'max:100'],
            'items.*.region' => ['required_with:items', 'string', 'max:100'],
            'items.*.farm' => ['nullable', 'string', 'max:100'],
            'items.*.process' => ['required_with:items', 'string', 'max:50'],
            'items.*.variety' => ['nullable', 'string', 'max:100'],
            'items.*.altitude' => ['nullable', 'string', 'max:50'],
            'items.*.quantity_kg' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.price_per_kg' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.expected_cupping_score' => ['nullable', 'numeric', 'between:0,100'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
