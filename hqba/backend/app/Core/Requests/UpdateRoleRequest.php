<?php

namespace App\Core\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')->id ?? $this->route('role');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:100',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('roles', 'name')->ignore($roleId)->where('guard_name', 'web'),
            ],
        ];
    }
}
