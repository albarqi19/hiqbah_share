<?php

namespace App\Modules\Recipes\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEspressoTrialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dose' => ['required', 'numeric', 'min:1', 'max:50'],
            'grind_setting' => ['required', 'string', 'max:50'],
            'extraction_time' => ['required', 'integer', 'min:1', 'max:120'],
            'yield' => ['required', 'numeric', 'min:1'],
            'tds' => ['nullable', 'numeric', 'min:0', 'max:30'],
            'acidity' => ['nullable', 'integer', 'min:1', 'max:10'],
            'finish' => ['nullable', 'integer', 'min:1', 'max:10'],
            'balance' => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
