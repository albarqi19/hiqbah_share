<?php

namespace App\Modules\Procurement\Requests;

use App\Modules\Procurement\Enums\GrnCondition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreGoodsReceiptNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'received_at' => ['nullable', 'date'],
            'bags_received' => ['required', 'integer', 'min:0'],
            'total_weight_received' => ['required', 'numeric', 'min:0'],
            'delivery_note_number' => ['nullable', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:100'],
            'shipping_documents' => ['nullable', 'array'],
            'shipping_documents.*' => ['string', 'max:500'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string', 'max:500'],
            'condition' => ['nullable', new Enum(GrnCondition::class)],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id' => ['required', 'integer', 'exists:purchase_order_items,id'],
            'items.*.bags_received' => ['required', 'integer', 'min:0'],
            'items.*.weight_received' => ['required', 'numeric', 'min:0'],
            'items.*.condition' => ['nullable', new Enum(GrnCondition::class)],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
