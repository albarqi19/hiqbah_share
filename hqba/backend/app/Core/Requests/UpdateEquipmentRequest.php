<?php

namespace App\Core\Requests;

use App\Core\Enums\EquipmentStatus;
use App\Core\Enums\EquipmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['sometimes', 'exists:branches,id'],
            'type' => ['sometimes', Rule::enum(EquipmentType::class)],
            'code' => [
                'sometimes', 'string', 'max:20',
                Rule::unique('equipment')
                    ->where('branch_id', $this->branch_id ?? $this->equipment->branch_id)
                    ->ignore($this->equipment),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(EquipmentStatus::class)],
            'notes' => ['nullable', 'string'],
        ];
    }
}
