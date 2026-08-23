<?php

namespace App\Modules\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['sometimes', 'string', 'max:255'],
            'company_name_ar' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['sometimes', 'string', 'max:255'],
            'contact_name_ar' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'source' => ['nullable', 'string', 'in:referral,website,exhibition,cold_call,social_media'],
            'notes' => ['nullable', 'string'],
            'estimated_monthly_kg' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
