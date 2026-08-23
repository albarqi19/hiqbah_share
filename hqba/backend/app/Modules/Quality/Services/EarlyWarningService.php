<?php

namespace App\Modules\Quality\Services;

use App\Modules\Production\Models\RoastBatch;
use App\Modules\Quality\Models\Complaint;
use App\Modules\Quality\Models\WasteRecord;

class EarlyWarningService
{
    public function getWarnings(): array
    {
        $warnings = [];

        // 1. Repeated rejections: batches rejected in last 7 days
        $recentRejections = RoastBatch::where('status', 'rejected')
            ->where('updated_at', '>=', now()->subDays(7))
            ->count();
        if ($recentRejections >= 3) {
            $warnings[] = [
                'type' => 'batch_rejection_spike',
                'severity' => 'high',
                'message_en' => "{$recentRejections} batches rejected in last 7 days",
                'message_ar' => "{$recentRejections} دفعات مرفوضة في آخر 7 أيام",
                'count' => $recentRejections,
            ];
        }

        // 2. Complaint spike: more than 5 complaints this month
        $monthlyComplaints = Complaint::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        if ($monthlyComplaints >= 5) {
            $warnings[] = [
                'type' => 'complaint_spike',
                'severity' => 'medium',
                'message_en' => "{$monthlyComplaints} complaints this month",
                'message_ar' => "{$monthlyComplaints} شكاوى هذا الشهر",
                'count' => $monthlyComplaints,
            ];
        }

        // 3. High waste: if today's waste exceeds 500g
        $todayWaste = WasteRecord::whereDate('created_at', today())->sum('weight_grams');
        if ($todayWaste > 500) {
            $warnings[] = [
                'type' => 'high_waste',
                'severity' => 'medium',
                'message_en' => "Today's waste: " . round($todayWaste) . "g",
                'message_ar' => "هدر اليوم: " . round($todayWaste) . " جرام",
                'count' => round($todayWaste),
            ];
        }

        // 4. Unresolved complaints > 3 days old
        $unresolvedOld = Complaint::whereNull('resolved_at')
            ->where('created_at', '<', now()->subDays(3))
            ->count();
        if ($unresolvedOld > 0) {
            $warnings[] = [
                'type' => 'unresolved_complaints',
                'severity' => 'high',
                'message_en' => "{$unresolvedOld} complaints unresolved for >3 days",
                'message_ar' => "{$unresolvedOld} شكاوى غير محلولة منذ أكثر من 3 أيام",
                'count' => $unresolvedOld,
            ];
        }

        return $warnings;
    }
}
