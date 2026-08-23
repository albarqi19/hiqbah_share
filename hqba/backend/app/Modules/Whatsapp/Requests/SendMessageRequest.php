<?php

namespace App\Modules\Whatsapp\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'min:7', 'max:30'],
            'message' => ['required', 'string', 'min:1', 'max:4000'],
            'instance_id' => ['nullable', 'integer', 'exists:whatsapp_instances,id'],
        ];
    }
}
