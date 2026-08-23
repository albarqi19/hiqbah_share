<?php

namespace App\Modules\Branch\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddShotRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'dose' => ['required', 'numeric', 'min:1'],
            'grind_setting' => ['required', 'string'],
            'extraction_time' => ['required', 'integer', 'min:1'],
            'yield' => ['required', 'numeric', 'min:1'],
            'tds' => ['nullable', 'numeric', 'min:0'],
            'acidity_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'finish_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'balance_score' => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
