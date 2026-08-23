<?php

namespace App\Modules\Crops\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Crops\Events\TrialRoastCompleted;
use App\Modules\Crops\Models\CuppingSession;

class OnTrialRoastCompleted
{
    public function handle(TrialRoastCompleted $event): void
    {
        $trial = $event->trialRoast;
        $crop = $trial->crop;

        // Only auto-schedule if crop has advanced to cupping status
        if ($crop->status->value !== 'cupping') {
            return;
        }

        // Get all completed trials that don't have a cupping session yet
        $trialsWithoutCupping = $crop->trialRoasts()
            ->where('status', 'completed')
            ->whereDoesntHave('cuppingSessions')
            ->get();

        foreach ($trialsWithoutCupping as $completedTrial) {
            CuppingSession::create([
                'crop_id' => $crop->id,
                'trial_roast_id' => $completedTrial->id,
                'grader_id' => $completedTrial->roaster_id,
                'scheduled_date' => now()->addDays(2),
                'cups_count' => 5,
                'dose_per_cup' => 10,
                'total_coffee_used' => 50,
                'sample_number' => $completedTrial->trial_number,
                'is_blind_cupping' => false,
                'status' => 'scheduled',
            ]);
        }

        if ($trialsWithoutCupping->isNotEmpty()) {
            app(NotificationService::class)->sendToAdmins(
                'cupping_scheduled',
                "Cupping auto-scheduled for {$crop->serial_number}",
                "تم جدولة كَبِّينغ تلقائياً للمحصول {$crop->serial_number}",
                "{$trialsWithoutCupping->count()} session(s) scheduled",
                "تم جدولة {$trialsWithoutCupping->count()} جلسة",
                "/crops/{$crop->id}?tab=cupping",
                get_class($crop),
                $crop->id,
            );
        }
    }
}
