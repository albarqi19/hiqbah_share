<?php

namespace App\Core\Requests;

use App\Core\Enums\EquipmentStatus;
use App\Core\Enums\EquipmentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'type' => ['required', Rule::enum(EquipmentType::class)],
            'code' => [
                'required', 'string', 'max:20',
                Rule::unique('equipment')->where('branch_id', $this->branch_id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(EquipmentStatus::class)],
            'notes' => ['nullable', 'string'],
        ];
    }
}
