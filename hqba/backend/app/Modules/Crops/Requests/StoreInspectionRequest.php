<?php

namespace App\Modules\Crops\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inspector_id' => ['required', 'exists:users,id'],
            'moisture_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'water_activity' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'density' => ['nullable', 'numeric', 'min:0'],
            'screen_size' => ['nullable', 'string', 'max:50'],
            'defect_count' => ['nullable', 'integer', 'min:0'],
            'defect_notes' => ['nullable', 'string'],
            'visual_notes' => ['nullable', 'string'],
            'decision' => ['required', 'in:approved,rejected,conditional'],
            'rejection_reason' => ['nullable', 'required_if:decision,rejected', 'string'],
            'condition_notes' => ['nullable', 'required_if:decision,conditional', 'string'],
            'photos' => ['nullable', 'array'],
            'inspected_at' => ['nullable', 'date'],
        ];
    }
}
