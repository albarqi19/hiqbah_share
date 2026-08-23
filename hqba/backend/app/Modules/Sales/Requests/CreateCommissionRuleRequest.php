<?php

namespace App\Modules\Sales\Requests;

use App\Modules\Sales\Enums\CommissionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCommissionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(CommissionType::class)],
            'value' => ['required', 'numeric', 'min:0'],
            'sales_rep_id' => ['nullable', 'exists:users,id'],
            'customer_tier' => ['nullable', 'string', 'in:standard,silver,gold,vip'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
