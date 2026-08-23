<?php

namespace App\Core\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncUserRolesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'roles' => ['present', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }
}
