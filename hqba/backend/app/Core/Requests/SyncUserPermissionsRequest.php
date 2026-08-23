<?php

namespace App\Core\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncUserPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
