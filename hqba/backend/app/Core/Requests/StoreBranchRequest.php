<?php

namespace App\Core\Requests;

use App\Core\Enums\BranchType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBranchRequest extends FormRequest
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
            'type' => ['required', Rule::enum(BranchType::class)],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
