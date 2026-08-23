<?php

namespace App\Modules\Branch\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartCalibrationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'equipment_machine_id' => ['required', 'exists:equipment,id'],
            'equipment_grinder_id' => ['required', 'exists:equipment,id'],
            'crop_id' => ['required', 'exists:crops,id'],
            'recipe_id' => ['nullable', 'exists:recipes,id'],
            'barista_id' => ['required', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
