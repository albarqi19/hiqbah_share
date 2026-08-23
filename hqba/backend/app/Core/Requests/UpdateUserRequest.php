<?php

namespace App\Core\Requests;

use App\Core\Enums\Language;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id ?? $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($userId)->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', Password::defaults()],
            'pin' => ['nullable', 'string', 'size:6'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'language' => ['sometimes', Rule::enum(Language::class)],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
