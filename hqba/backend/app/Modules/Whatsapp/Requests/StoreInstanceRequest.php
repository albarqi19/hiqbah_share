<?php

namespace App\Modules\Whatsapp\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'regex:/^[a-z0-9_]+$/i', 'max:60', 'unique:whatsapp_instances,name'],
            'display_name' => ['nullable', 'string', 'max:120'],
            'is_default' => ['boolean'],
        ];
    }
}
