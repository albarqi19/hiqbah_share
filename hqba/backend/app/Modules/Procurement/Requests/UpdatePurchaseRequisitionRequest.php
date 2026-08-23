<?php

namespace App\Modules\Procurement\Requests;

use App\Modules\Procurement\Enums\RequisitionDepartment;
use App\Modules\Procurement\Enums\RequisitionUrgency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdatePurchaseRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department' => ['sometimes', new Enum(RequisitionDepartment::class)],
            'urgency' => ['sometimes', 'nullable', new Enum(RequisitionUrgency::class)],
            'target_quantity_kg' => ['sometimes', 'numeric', 'min:0.01'],
            'target_price_per_kg' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'target_origin_country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'target_region' => ['sometimes', 'nullable', 'string', 'max:100'],
            'target_process' => ['sometimes', 'nullable', 'string', 'max:50'],
            'target_variety' => ['sometimes', 'nullable', 'string', 'max:100'],
            'preferred_supplier_id' => ['sometimes', 'nullable', 'exists:suppliers,id'],
            'needed_by' => ['sometimes', 'date'],
            'justification' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
