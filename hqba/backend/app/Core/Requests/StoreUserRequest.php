<?php

namespace App\Core\Requests;

use App\Core\Enums\Language;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
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
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', Password::defaults()],
            'pin' => ['nullable', 'string', 'size:6'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'language' => ['sometimes', Rule::enum(Language::class)],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
