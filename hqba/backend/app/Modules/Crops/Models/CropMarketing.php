<?php

namespace App\Modules\Crops\Models;

use App\Core\Models\User;
use App\Modules\Crops\Enums\MarketingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CropMarketing extends Model
{
    protected $table = 'crop_marketing';

    protected $fillable = [
        'crop_id',
        'product_name',
        'product_name_ar',
        'marketing_description',
        'marketing_description_ar',
        'flavor_display',
        'label_template',
        'label_pdf_url',
        'social_media_text',
        'social_media_text_ar',
        'photos',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => MarketingStatus::class,
            'photos' => 'array',
        ];
    }

    // ── Relationships ──

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
