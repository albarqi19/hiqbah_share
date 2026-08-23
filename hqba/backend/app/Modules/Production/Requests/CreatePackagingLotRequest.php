<?php

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePackagingLotRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'exists:crops,id'],
            'roast_batch_id' => ['nullable', 'exists:roast_batches,id'],
            'packed_by' => ['required', 'exists:users,id'],
            'package_size' => ['required', 'in:250,500,1000'],
            'bags_count' => ['required', 'integer', 'min:1'],
            'roasted_weight_used_kg' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
