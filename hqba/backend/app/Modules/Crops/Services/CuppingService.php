<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CuppingSession;
use App\Modules\Crops\Models\TrialRoast;
use App\Modules\Crops\Events\CuppingCompleted;

class CuppingService
{
    public function __construct(
        protected CropService $cropService,
        protected TrialRoastService $trialRoastService,
    ) {}

    public function listForCrop(Crop $crop)
    {
        return $crop->cuppingSessions()
            ->with(['grader', 'trialRoast'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function schedule(Crop $crop, array $data): CuppingSession
    {
        $data['crop_id'] = $crop->id;
        $data['status'] = $data['status'] ?? 'scheduled';

        // Calculate total coffee used
        $data['total_coffee_used'] = ($data['cups_count'] ?? 0) * ($data['dose_per_cup'] ?? 0);

        $session = CuppingSession::create($data);

        // Auto-calculate final score if scores provided
        if (!empty($data['fragrance']) || !empty($data['flavor'])) {
            $session->calculateFinalScore();
            $session->save();
        }

        return $session->fresh();
    }

    public function update(CuppingSession $session, array $data): CuppingSession
    {
        if (isset($data['cups_count']) || isset($data['dose_per_cup'])) {
            $cups = $data['cups_count'] ?? $session->cups_count;
            $dose = $data['dose_per_cup'] ?? $session->dose_per_cup;
            $data['total_coffee_used'] = $cups * $dose;
        }

        $session->update($data);

        return $session->fresh();
    }

    public function complete(CuppingSession $session, array $scores): CuppingSession
    {
        $scores['status'] = 'completed';
        $session->update($scores);

        // Deduct coffee used from crop's remaining green weight
        $crop = $session->crop;
        $crop->deductGreenWeight($session->total_coffee_used);

        CuppingCompleted::dispatch($session);

        return $session->fresh();
    }

    /**
     * Approve/Reject/Retest the cupping.
     * On approve: automatically selects the best trial roast based on highest cupping score.
     */
    public function decide(CuppingSession $session, string $decision, ?string $reason = null): CuppingSession
    {
        $session->update([
            'decision' => $decision,
            'rejection_reason' => $decision === 'rejected' ? $reason : null,
        ]);

        $crop = $session->crop;

        if ($decision === 'approved' && $crop->status->value === 'cupping') {
            // Find the best trial roast based on highest cupping score
            $bestSession = $crop->cuppingSessions()
                ->whereNotNull('final_score')
                ->orderByDesc('final_score')
                ->first();

            if ($bestSession && $bestSession->trialRoast) {
                // Select the best trial roast automatically
                $this->trialRoastService->select($bestSession->trialRoast);

                // Copy flavor notes from the best cupping session to crop
                $crop->update([
                    'flavor_notes' => $bestSession->flavor_notes,
                    'description' => $bestSession->description,
                    'description_ar' => $bestSession->description,
                    'brew_recommendations' => $bestSession->brew_recommendations,
                    'usage_type' => $bestSession->trialRoast->usage_type,
                ]);
            }

            $this->cropService->advanceStatus($crop, 'approved');
        }

        if ($decision === 'retest') {
            if ($crop->status->value === 'cupping') {
                // Go back to trial_roasting for new trials
                $this->cropService->advanceStatus($crop, 'trial_roasting');
            }
        }

        return $session->fresh();
    }

    public function delete(CuppingSession $session): void
    {
        $session->delete();
    }
}
