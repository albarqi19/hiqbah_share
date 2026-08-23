<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\GreenCoffeeInspection;
use App\Modules\Crops\Models\GreenCoffeeLot;
use App\Modules\Crops\Events\GreenCoffeeReceived;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class GreenCoffeeService
{
    public function __construct(protected CropService $cropService) {}

    public function listLots(): LengthAwarePaginator
    {
        return QueryBuilder::for(GreenCoffeeLot::class)
            ->allowedFilters([
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('status'),
                'batch_id',
            ])
            ->allowedSorts(['batch_id', 'arrival_date', 'actual_weight'])
            ->allowedIncludes(['crop', 'purchaseOrder', 'inspections', 'receivedBy'])
            ->defaultSort('-arrival_date')
            ->paginate(request('per_page', 15));
    }

    public function receive(array $data): GreenCoffeeLot
    {
        $data['batch_id'] = GreenCoffeeLot::generateBatchId();
        $data['weight_variance'] = ($data['actual_weight'] ?? 0) - ($data['expected_weight'] ?? 0);

        $lot = GreenCoffeeLot::create($data);

        // Update crop weight and status
        $crop = Crop::find($data['crop_id']);
        $crop->update([
            'total_green_weight' => $crop->total_green_weight + $data['actual_weight'],
            'remaining_green_weight' => $crop->remaining_green_weight + $data['actual_weight'],
        ]);

        if ($crop->status->value === 'ordered') {
            $this->cropService->advanceStatus($crop, 'received');
        }

        GreenCoffeeReceived::dispatch($lot);

        return $lot->load(['crop', 'receivedBy']);
    }

    public function inspect(GreenCoffeeLot $lot, array $data): GreenCoffeeInspection
    {
        $data['green_coffee_lot_id'] = $lot->id;
        $data['inspected_at'] = $data['inspected_at'] ?? now();

        $inspection = GreenCoffeeInspection::create($data);

        // Update lot status
        $lot->update(['status' => 'inspecting']);

        // Update crop status
        $crop = $lot->crop;
        if ($crop->status->value === 'received') {
            $this->cropService->advanceStatus($crop, 'inspecting');
        }

        return $inspection->load('inspector');
    }

    public function decide(GreenCoffeeInspection $inspection, string $decision, ?string $reason = null, ?string $conditionNotes = null): GreenCoffeeInspection
    {
        $inspection->update([
            'decision' => $decision,
            'rejection_reason' => $decision === 'rejected' ? $reason : null,
            'condition_notes' => $decision === 'conditional' ? $conditionNotes : null,
        ]);

        // Update lot status based on decision
        $lot = $inspection->greenCoffeeLot;
        $lot->update(['status' => $decision]);

        // If approved or conditional, advance crop to trial_roasting
        if (in_array($decision, ['approved', 'conditional'])) {
            $crop = $lot->crop;
            if ($crop->status->value === 'inspecting') {
                $this->cropService->advanceStatus($crop, 'trial_roasting');
            }
        }

        return $inspection->fresh();
    }
}
