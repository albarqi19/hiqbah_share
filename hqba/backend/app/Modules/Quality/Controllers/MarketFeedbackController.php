<?php

namespace App\Modules\Quality\Controllers;

use App\Core\Controllers\ApiController;
use App\Modules\Quality\Models\MarketFeedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MarketFeedbackController extends ApiController
{
    public function index(): JsonResponse
    {
        $data = QueryBuilder::for(MarketFeedback::class)
            ->allowedFilters([
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('source'),
                AllowedFilter::exact('feedback_type'),
                AllowedFilter::exact('branch_id'),
            ])
            ->allowedSorts(['created_at', 'rating'])
            ->allowedIncludes(['crop', 'branch', 'creator'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));

        return $this->success($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'crop_id' => ['nullable', 'exists:crops,id'],
            'source' => ['required', 'in:barista,customer,wholesale'],
            'feedback_type' => ['required', 'in:taste,aroma,packaging,general'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);
        $data['created_by'] = auth()->id();

        return $this->created(MarketFeedback::create($data)->load(['crop', 'branch']));
    }

    public function summary(): JsonResponse
    {
        $total = MarketFeedback::count();
        $avgRating = MarketFeedback::whereNotNull('rating')->avg('rating');
        $bySource = MarketFeedback::selectRaw('source, count(*) as count, avg(rating) as avg_rating')
            ->groupBy('source')->get();
        $byType = MarketFeedback::selectRaw('feedback_type, count(*) as count')
            ->groupBy('feedback_type')->get();
        $recent = MarketFeedback::with(['crop', 'creator'])
            ->latest()->take(10)->get();

        return $this->success([
            'total' => $total,
            'avg_rating' => round($avgRating ?? 0, 1),
            'by_source' => $bySource,
            'by_type' => $byType,
            'recent' => $recent,
        ]);
    }
}
