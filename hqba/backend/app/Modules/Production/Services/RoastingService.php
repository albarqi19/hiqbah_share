<?php

namespace App\Modules\Production\Services;

use App\Core\Services\NotificationService;
use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Services\CropService;
use App\Modules\Production\Enums\RoastBatchStatus;
use App\Modules\Production\Events\RoastBatchCompleted;
use App\Modules\Production\Events\RoastBatchStarted;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Quality\Models\WasteRecord;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RoastingService
{
    public function __construct(protected CropService $cropService) {}

    /**
     * Get the roasting queue (ordered by priority + position).
     */
    public function getQueue(): LengthAwarePaginator
    {
        return QueryBuilder::for(RoastBatch::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('roaster_id'),
            ])
            ->allowedSorts(['queue_position', 'created_at', 'status', 'green_weight_kg'])
            ->allowedIncludes(['crop', 'recipe', 'roaster'])
            ->defaultSort('is_priority', 'queue_position')
            ->paginate(request('per_page', 25));
    }

    /**
     * Create a new roast batch and add to queue.
     */
    public function create(array $data): RoastBatch
    {
        $data['batch_number'] = RoastBatch::generateBatchNumber();
        $data['status'] = RoastBatchStatus::Queued->value;

        // Set queue position (at end)
        $data['queue_position'] = RoastBatch::where('status', 'queued')->max('queue_position') + 1;

        $batch = RoastBatch::create($data);

        // Load target profile from selected trial roast
        $batch->loadTargetProfile();
        $batch->save();

        // Advance crop to in_production if it's production_ready
        $crop = $batch->crop;
        if ($crop->status->value === 'production_ready') {
            $this->cropService->advanceStatus($crop, 'in_production');
        }

        return $batch->load(['crop', 'roaster', 'recipe']);
    }

    /**
     * Start roasting a batch.
     */
    public function start(RoastBatch $batch): RoastBatch
    {
        $batch->update([
            'status' => RoastBatchStatus::Roasting,
            'started_at' => now(),
        ]);

        // Deduct from crop's remaining green weight (kg)
        $crop = $batch->crop;
        $crop->deductGreenWeightKg((float) $batch->green_weight_kg);

        RoastBatchStarted::dispatch($batch);

        return $batch->fresh();
    }

    /**
     * Complete a roast batch with actual roast data.
     */
    public function complete(RoastBatch $batch, array $data): RoastBatch
    {
        $data['status'] = RoastBatchStatus::PendingQc->value;
        $data['completed_at'] = now();

        $batch->update($data);
        $batch->calculateRoastLoss();
        $batch->save();

        // Auto-record waste
        WasteRecord::firstOrCreate(
            ['source_type' => get_class($batch), 'source_id' => $batch->id],
            [
                'crop_id' => $batch->crop_id,
                'waste_type' => 'roast_loss',
                'weight_grams' => ($batch->roast_loss_kg ?? 0) * 1000,
                'reason' => "Roast loss {$batch->batch_number} ({$batch->roast_loss_percent}%)",
                'created_by' => $batch->roaster_id,
                'created_at' => now(),
            ]
        );

        RoastBatchCompleted::dispatch($batch);

        app(NotificationService::class)->sendToAdmins(
            'roast_batch_completed',
            "Roast batch {$batch->batch_number} completed - {$batch->roasted_weight_kg}kg",
            "اكتملت دفعة التحميص {$batch->batch_number} - {$batch->roasted_weight_kg} كجم",
            null, null,
            "/stations/roaster",
            get_class($batch),
            $batch->id,
        );

        return $batch->fresh();
    }

    /**
     * Reorder queue positions.
     */
    public function reorder(array $orderedIds): void
    {
        foreach ($orderedIds as $position => $batchId) {
            RoastBatch::where('id', $batchId)
                ->where('status', 'queued')
                ->update(['queue_position' => $position + 1]);
        }
    }

    /**
     * Show a single batch with relations.
     */
    public function show(RoastBatch $batch): RoastBatch
    {
        return $batch->load(['crop', 'recipe', 'roaster', 'wasteRecord']);
    }
}
