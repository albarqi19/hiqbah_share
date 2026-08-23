<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CropMarketing;

class MarketingService
{
    public function __construct(
        protected CropService $cropService,
    ) {}

    public function getForCrop(Crop $crop): ?CropMarketing
    {
        return $crop->marketing;
    }

    public function create(Crop $crop, array $data): CropMarketing
    {
        // Auto-populate from crop data
        $data['crop_id'] = $crop->id;
        $data['product_name'] = $data['product_name'] ?? $crop->name;
        $data['product_name_ar'] = $data['product_name_ar'] ?? $crop->name_ar;

        if (empty($data['flavor_display']) && $crop->flavor_notes) {
            $data['flavor_display'] = implode(' • ', $crop->flavor_notes);
        }

        return CropMarketing::updateOrCreate(
            ['crop_id' => $crop->id],
            $data,
        );
    }

    public function update(CropMarketing $marketing, array $data): CropMarketing
    {
        $marketing->update($data);

        return $marketing->fresh();
    }

    public function approve(Crop $crop): CropMarketing
    {
        $marketing = $crop->marketing;

        if (! $marketing) {
            throw new \RuntimeException('Marketing data must be created before approval.');
        }

        $marketing->update(['status' => 'approved']);

        if ($crop->status->value === 'marketing') {
            $this->cropService->advanceStatus($crop, 'production_ready');
        }

        return $marketing->fresh();
    }
}
