<?php

namespace App\Modules\Crops\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Events\CropStatusChanged;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CropService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Crop::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('supplier_id'),
                AllowedFilter::exact('purchase_order_id'),
                AllowedFilter::exact('usage_type'),
                'name', 'serial_number', 'origin_country',
            ])
            ->allowedSorts(['serial_number', 'name', 'created_at', 'status', 'remaining_green_weight'])
            ->allowedIncludes(['supplier', 'purchaseOrder', 'pricing', 'marketing'])
            ->withCount(['greenCoffeeLots', 'trialRoasts', 'cuppingSessions', 'recipes', 'wasteRecords'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Crop
    {
        if (empty($data['serial_number'])) {
            $countryCode = strtoupper(substr($data['origin_country'] ?? 'UNK', 0, 3));
            $data['serial_number'] = Crop::generateSerialNumber($countryCode);
        }

        return Crop::create($data);
    }

    public function update(Crop $crop, array $data): Crop
    {
        $crop->update($data);

        return $crop->fresh();
    }

    public function delete(Crop $crop): void
    {
        $crop->delete();
    }

    public function advanceStatus(Crop $crop, string $newStatus): Crop
    {
        $allowed = $this->getAllowedTransitions($crop->status->value);

        if (! in_array($newStatus, $allowed)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$crop->status->value} to {$newStatus}"
            );
        }

        $oldStatus = $crop->status->value;
        $crop->update(['status' => $newStatus]);

        if ($newStatus === 'closed') {
            $crop->update(['closed_at' => now()]);
        }

        CropStatusChanged::dispatch($crop, $oldStatus, $newStatus);

        return $crop->fresh();
    }

    public function getTimeline(Crop $crop): array
    {
        $crop->load([
            'purchaseOrder', 'supplier',
            'greenCoffeeLots.inspections.inspector',
            'trialRoasts.roaster',
            'cuppingSessions.grader',
            'pricing', 'marketing',
            'recipes',
            'wasteRecords',
        ]);

        $timeline = [];

        // PO
        if ($crop->purchaseOrder) {
            $timeline[] = [
                'stage' => 'purchase_order',
                'status' => 'completed',
                'date' => $crop->purchaseOrder->created_at,
                'data' => $crop->purchaseOrder->toArray(),
            ];
        }

        // Green coffee lots
        foreach ($crop->greenCoffeeLots as $lot) {
            $timeline[] = [
                'stage' => 'receiving',
                'status' => 'completed',
                'date' => $lot->arrival_date,
                'data' => $lot->toArray(),
            ];
            foreach ($lot->inspections as $inspection) {
                $timeline[] = [
                    'stage' => 'inspection',
                    'status' => 'completed',
                    'date' => $inspection->inspected_at,
                    'data' => $inspection->toArray(),
                ];
            }
        }

        // Trial roasts
        foreach ($crop->trialRoasts as $trial) {
            $timeline[] = [
                'stage' => 'trial_roasting',
                'status' => $trial->status->value === 'selected' ? 'completed' : $trial->status->value,
                'date' => $trial->roasted_at,
                'data' => $trial->toArray(),
            ];
        }

        // Cupping sessions
        foreach ($crop->cuppingSessions as $session) {
            $timeline[] = [
                'stage' => 'cupping',
                'status' => $session->status->value,
                'date' => $session->created_at,
                'data' => $session->toArray(),
            ];
        }

        // Pricing
        if ($crop->pricing) {
            $timeline[] = [
                'stage' => 'pricing',
                'status' => $crop->pricing->status->value,
                'date' => $crop->pricing->created_at,
                'data' => $crop->pricing->toArray(),
            ];
        }

        // Marketing
        if ($crop->marketing) {
            $timeline[] = [
                'stage' => 'marketing',
                'status' => $crop->marketing->status->value,
                'date' => $crop->marketing->created_at,
                'data' => $crop->marketing->toArray(),
            ];
        }

        // Sort by date
        usort($timeline, fn ($a, $b) => strtotime($a['date']) - strtotime($b['date']));

        return $timeline;
    }

    public function getTraceability(Crop $crop): array
    {
        $crop->load([
            'purchaseOrder.supplier',
            'greenCoffeeLots.inspections',
            'trialRoasts',
            'cuppingSessions',
            'recipes.espressoRecipe',
            'pricing',
            'marketing',
            'wasteRecords',
        ]);

        return [
            'crop' => [
                'serial_number' => $crop->serial_number,
                'name' => $crop->name,
                'name_ar' => $crop->name_ar,
                'origin' => "{$crop->origin_country}, {$crop->region}",
                'farm' => $crop->farm,
                'process' => $crop->process,
                'variety' => $crop->variety,
                'altitude' => $crop->altitude,
            ],
            'supplier' => $crop->purchaseOrder?->supplier ? [
                'name' => $crop->purchaseOrder->supplier->name,
                'country' => $crop->purchaseOrder->supplier->country,
            ] : null,
            'quality' => [
                'cupping_score' => $crop->cuppingSessions->max('final_score'),
                'classification' => $crop->cuppingSessions->first()?->classification,
                'flavor_notes' => $crop->flavor_notes,
                'roast_loss_percent' => $crop->trialRoasts->where('status', 'selected')->first()?->roast_loss_percent,
            ],
            'pricing' => $crop->pricing ? [
                'retail_250g' => $crop->pricing->retail_price_250g,
                'retail_500g' => $crop->pricing->retail_price_500g,
                'retail_1kg' => $crop->pricing->retail_price_1kg,
            ] : null,
            'total_waste_grams' => $crop->wasteRecords->sum('weight_grams'),
            'journey_stages' => $this->getJourneyStages($crop),
        ];
    }

    private function getJourneyStages(Crop $crop): array
    {
        $statusOrder = ['ordered', 'received', 'inspecting', 'trial_roasting', 'cupping', 'approved', 'pricing', 'marketing', 'production_ready', 'in_production', 'depleted', 'closed'];
        $currentIndex = array_search($crop->status->value, $statusOrder);

        $stages = [
            ['id' => 'purchase_order', 'name' => 'طلب المحصول', 'name_en' => 'Purchase Order'],
            ['id' => 'receiving', 'name' => 'الاستلام', 'name_en' => 'Receiving'],
            ['id' => 'inspection', 'name' => 'الفحص', 'name_en' => 'Inspection'],
            ['id' => 'trial_roasting', 'name' => 'تحميص تجريبي', 'name_en' => 'Trial Roasting'],
            ['id' => 'cupping', 'name' => 'التقييم', 'name_en' => 'Cupping'],
            ['id' => 'approval', 'name' => 'الاعتماد', 'name_en' => 'Approval'],
            ['id' => 'recipe', 'name' => 'الوصفة', 'name_en' => 'Recipe'],
            ['id' => 'pricing', 'name' => 'التسعير', 'name_en' => 'Pricing'],
            ['id' => 'marketing', 'name' => 'التسويق', 'name_en' => 'Marketing'],
            ['id' => 'production', 'name' => 'الإنتاج', 'name_en' => 'Production'],
            ['id' => 'packaging', 'name' => 'التعبئة', 'name_en' => 'Packaging'],
            ['id' => 'sales', 'name' => 'البيع', 'name_en' => 'Sales'],
        ];

        // Map stages to their corresponding status index
        $stageStatusMap = [0, 1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10];

        return array_map(function ($stage, $i) use ($currentIndex, $stageStatusMap) {
            $stageIndex = $stageStatusMap[$i] ?? $i;
            $stage['status'] = $stageIndex < $currentIndex ? 'completed' : ($stageIndex === $currentIndex ? 'active' : 'pending');

            return $stage;
        }, $stages, array_keys($stages));
    }

    protected function getAllowedTransitions(string $currentStatus): array
    {
        return match ($currentStatus) {
            'ordered' => ['received'],
            'received' => ['inspecting', 'trial_roasting'], // inspection optional
            'inspecting' => ['trial_roasting'],
            'trial_roasting' => ['cupping'],
            'cupping' => ['approved', 'trial_roasting'], // retest → back to trial
            'approved' => ['pricing'],
            'pricing' => ['marketing'],
            'marketing' => ['production_ready'],
            'production_ready' => ['in_production'],
            'in_production' => ['depleted', 'closed'],
            'depleted' => ['closed'],
            default => [],
        };
    }
}
