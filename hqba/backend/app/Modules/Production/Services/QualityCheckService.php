<?php

namespace App\Modules\Production\Services;

use App\Core\Services\NotificationService;
use App\Modules\Production\Enums\RoastBatchStatus;
use App\Modules\Production\Events\QualityCheckDone;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Production\Models\RoastQualityCheck;
use App\Modules\Quality\Models\WasteRecord;

class QualityCheckService
{
    public function create(RoastBatch $batch, array $data): RoastQualityCheck
    {
        $data['roast_batch_id'] = $batch->id;
        $data['checked_at'] = $data['checked_at'] ?? now();

        $qc = RoastQualityCheck::create($data);
        $qc->calculateTotalScore();
        $qc->save();

        // Auto-record waste for QC sample
        WasteRecord::firstOrCreate(
            ['source_type' => get_class($qc), 'source_id' => $qc->id],
            [
                'crop_id' => $batch->crop_id,
                'waste_type' => 'qc_sample',
                'weight_grams' => $qc->sample_weight_grams,
                'reason' => "QC sample: {$batch->batch_number}",
                'created_by' => $qc->inspector_id,
                'created_at' => now(),
            ]
        );

        QualityCheckDone::dispatch($qc);

        return $qc->fresh()->load('inspector');
    }

    public function decide(RoastQualityCheck $qc, string $decision, ?string $reason = null, ?string $corrective = null): RoastQualityCheck
    {
        $qc->update([
            'decision' => $decision,
            'rejection_reason' => $decision === 'rejected' ? $reason : null,
            'corrective_action' => $decision !== 'approved' ? $corrective : null,
        ]);

        $batch = $qc->roastBatch;

        if ($decision === 'approved') {
            $batch->update(['status' => RoastBatchStatus::Approved]);
        } elseif ($decision === 'rejected') {
            $batch->update(['status' => RoastBatchStatus::Rejected]);
            app(NotificationService::class)->sendToAdmins(
                'qc_rejected',
                "QC Rejected: {$batch->batch_number} - {$reason}",
                "فحص مرفوض: {$batch->batch_number} - {$reason}",
                null, null,
                '/stations/qc',
                get_class($batch),
                $batch->id,
            );
        } elseif ($decision === 'conditional') {
            // Conditional approval: batch returns to cooling for adjustments
            $batch->update(['status' => RoastBatchStatus::Cooling]);
            app(NotificationService::class)->sendToAdmins(
                'qc_conditional',
                "QC Conditional: {$batch->batch_number} - {$corrective}",
                "فحص مشروط: {$batch->batch_number} - {$corrective}",
                null, null,
                '/stations/qc',
                get_class($batch),
                $batch->id,
            );
        }

        return $qc->fresh()->load(['inspector', 'roastBatch']);
    }

    public function getPendingBatches()
    {
        return RoastBatch::where('status', RoastBatchStatus::PendingQc)
            ->with(['crop', 'roaster', 'qualityChecks.inspector'])
            ->orderBy('completed_at')
            ->get();
    }
}
