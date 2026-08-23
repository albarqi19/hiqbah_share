<?php

namespace App\Modules\Quality\Services;

use App\Modules\Quality\Models\WasteRecord;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class WasteService
{
    public function list()
    {
        return QueryBuilder::for(WasteRecord::class)
            ->allowedFilters([
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('waste_type'),
                AllowedFilter::exact('source_type'),
            ])
            ->allowedSorts(['created_at', 'weight_grams'])
            ->allowedIncludes(['crop', 'creator'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function recordWaste(array $data): WasteRecord
    {
        $data['created_at'] = $data['created_at'] ?? now();

        return WasteRecord::create($data);
    }

    public function getWasteByCrop(int $cropId): array
    {
        $records = WasteRecord::where('crop_id', $cropId)->get();

        return [
            'total_grams' => $records->sum('weight_grams'),
            'total_kg' => round($records->sum('weight_grams') / 1000, 3),
            'by_type' => $records->groupBy('waste_type')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total_grams' => $group->sum('weight_grams'),
                ];
            }),
            'records_count' => $records->count(),
        ];
    }

    public function getSummary(): array
    {
        $todayGrams = (float) WasteRecord::whereDate('created_at', today())->sum('weight_grams');
        $weekGrams = (float) WasteRecord::where('created_at', '>=', now()->startOfWeek())->sum('weight_grams');
        $monthGrams = (float) WasteRecord::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->sum('weight_grams');

        $byType = WasteRecord::selectRaw("waste_type, SUM(weight_grams) as total_grams, COUNT(*) as count")
            ->groupBy('waste_type')
            ->get()
            ->toArray();

        return [
            'today_grams' => $todayGrams,
            'week_grams' => $weekGrams,
            'month_grams' => $monthGrams,
            'by_type' => $byType,
        ];
    }
}
