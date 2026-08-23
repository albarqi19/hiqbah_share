<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\TrialRoast;
use App\Modules\Crops\Events\CropStatusChanged;
use App\Modules\Crops\Events\TrialRoastCompleted;
use App\Modules\Quality\Models\WasteRecord;

class TrialRoastService
{
    public function __construct(protected CropService $cropService) {}

    public function listForCrop(Crop $crop)
    {
        return $crop->trialRoasts()
            ->with(['roaster', 'cuppingSessions'])
            ->orderBy('trial_number')
            ->get();
    }

    public function create(Crop $crop, array $data): TrialRoast
    {
        $data['crop_id'] = $crop->id;
        $data['trial_number'] = $crop->trialRoasts()->max('trial_number') + 1;
        $data['roasted_at'] = $data['roasted_at'] ?? now();

        $trial = TrialRoast::create($data);

        // Deduct sample weight from crop's remaining green weight
        $crop->deductGreenWeight($data['sample_weight_grams']);

        return $trial->load('roaster');
    }

    public function update(TrialRoast $trial, array $data): TrialRoast
    {
        $trial->update($data);
        return $trial->fresh();
    }

    public function complete(TrialRoast $trial, array $data): TrialRoast
    {
        $data['status'] = 'completed';
        $trial->update($data);
        $trial->calculateRoastLoss();
        $trial->save();

        // Auto-record waste
        WasteRecord::firstOrCreate(
            ['source_type' => get_class($trial), 'source_id' => $trial->id],
            [
                'crop_id' => $trial->crop_id,
                'waste_type' => 'trial_roast_sample',
                'weight_grams' => $trial->sample_weight_grams,
                'reason' => "Trial roast #{$trial->trial_number}",
                'created_by' => $trial->roaster_id,
                'created_at' => now(),
            ]
        );

        // Check if ALL trials for this crop are completed → advance to cupping
        $crop = $trial->crop->fresh();
        $allCompleted = $crop->trialRoasts()
            ->where('status', 'in_progress')
            ->doesntExist();

        $hasTrials = $crop->trialRoasts()->count() > 0;

        if ($allCompleted && $hasTrials) {
            $preStages = ['ordered', 'received', 'inspecting', 'trial_roasting'];
            if (in_array($crop->status->value, $preStages)) {
                $crop->update(['status' => 'cupping']);
                CropStatusChanged::dispatch($crop, $crop->status->value, 'cupping');
            }
        }

        TrialRoastCompleted::dispatch($trial->fresh());

        return $trial->fresh();
    }

    /**
     * Select the best trial AFTER cupping (based on cupping scores).
     * This is called from CuppingService when approving.
     */
    public function select(TrialRoast $trial): TrialRoast
    {
        // Deselect all other trials for this crop
        TrialRoast::where('crop_id', $trial->crop_id)
            ->where('id', '!=', $trial->id)
            ->update(['status' => 'completed']);

        $trial->update(['status' => 'selected']);

        return $trial->fresh();
    }

    public function delete(TrialRoast $trial): void
    {
        $trial->delete();
    }
}
