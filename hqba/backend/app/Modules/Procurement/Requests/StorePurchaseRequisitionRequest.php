<?php

namespace App\Modules\Procurement\Requests;

use App\Modules\Procurement\Enums\RequisitionDepartment;
use App\Modules\Procurement\Enums\RequisitionUrgency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StorePurchaseRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department' => ['required', new Enum(RequisitionDepartment::class)],
            'urgency' => ['nullable', new Enum(RequisitionUrgency::class)],
            'target_quantity_kg' => ['required', 'numeric', 'min:0.01'],
            'target_price_per_kg' => ['nullable', 'numeric', 'min:0'],
            'target_origin_country' => ['nullable', 'string', 'max:100'],
            'target_region' => ['nullable', 'string', 'max:100'],
            'target_process' => ['nullable', 'string', 'max:50'],
            'target_variety' => ['nullable', 'string', 'max:100'],
            'preferred_supplier_id' => ['nullable', 'exists:suppliers,id'],
            'needed_by' => ['required', 'date', 'after_or_equal:today'],
            'justification' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
