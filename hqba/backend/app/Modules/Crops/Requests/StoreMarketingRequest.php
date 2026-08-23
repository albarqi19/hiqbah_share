<?php

namespace App\Modules\Crops\Requests;

use App\Modules\Crops\Enums\MarketingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMarketingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_name' => ['required', 'string', 'max:255'],
            'product_name_ar' => ['required', 'string', 'max:255'],
            'marketing_description' => ['nullable', 'string'],
            'marketing_description_ar' => ['nullable', 'string'],
            'flavor_display' => ['nullable', 'string', 'max:500'],
            'label_template' => ['nullable', 'string', 'max:255'],
            'label_pdf_url' => ['nullable', 'string', 'max:500'],
            'social_media_text' => ['nullable', 'string'],
            'social_media_text_ar' => ['nullable', 'string'],
            'photos' => ['nullable', 'array'],
            'status' => ['sometimes', Rule::enum(MarketingStatus::class)],
            'created_by' => ['required', 'exists:users,id'],
        ];
    }
}
