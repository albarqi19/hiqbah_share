<?php

namespace App\Core\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['present'],
            'settings.*.group' => ['sometimes', 'string'],
            'settings.*.type' => ['sometimes', 'string', 'in:string,integer,boolean,json'],
        ];
    }
}
