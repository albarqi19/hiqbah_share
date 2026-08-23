<?php

namespace App\Modules\Quality\Listeners;

use App\Core\Services\NotificationService;
use App\Modules\Crops\Events\CuppingCompleted;
use App\Modules\Quality\Models\WasteRecord;

class OnCuppingCompleted
{
    public function handle(CuppingCompleted $event): void
    {
        $session = $event->cuppingSession;

        WasteRecord::create([
            'crop_id' => $session->crop_id,
            'source_type' => get_class($session),
            'source_id' => $session->id,
            'waste_type' => 'cupping_waste',
            'weight_grams' => $session->total_coffee_used,
            'reason' => "Cupping session #{$session->id}",
            'created_by' => $session->grader_id,
            'created_at' => now(),
        ]);

        app(NotificationService::class)->sendToAdmins(
            'cupping_completed',
            "Cupping completed - Score: {$session->final_score}",
            "اكتمل التقييم - النتيجة: {$session->final_score}",
            null,
            null,
            "/crops/{$session->crop_id}?tab=cupping",
            get_class($session),
            $session->id,
        );
    }
}
