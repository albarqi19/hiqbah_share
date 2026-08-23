<?php

namespace App\Modules\Branch\Services;

use App\Core\Services\NotificationService;
use App\Modules\Branch\Enums\CalibrationStatus;
use App\Modules\Branch\Events\CalibrationCompleted;
use App\Modules\Branch\Models\CalibrationSession;
use App\Modules\Branch\Models\CalibrationShot;
use App\Modules\Quality\Models\WasteRecord;
use App\Modules\Recipes\Models\EspressoRecipe;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CalibrationService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(CalibrationSession::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('barista_id'),
            ])
            ->allowedSorts(['created_at', 'status'])
            ->allowedIncludes(['branch', 'machine', 'grinder', 'crop', 'recipe', 'barista', 'shots'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function startSession(array $data): CalibrationSession
    {
        $data['status'] = CalibrationStatus::Open->value;

        // Auto-find the published recipe for this crop
        if (empty($data['recipe_id'])) {
            $recipe = \App\Modules\Recipes\Models\Recipe::where('crop_id', $data['crop_id'])
                ->where('status', 'published')
                ->where('recipe_type', 'espresso')
                ->where('is_current', true)
                ->first();
            $data['recipe_id'] = $recipe?->id;
        }

        $session = CalibrationSession::create($data);

        return $session->load(['branch', 'machine', 'grinder', 'crop', 'recipe.espressoRecipe', 'barista']);
    }

    public function addShot(CalibrationSession $session, array $data): CalibrationShot
    {
        $data['calibration_session_id'] = $session->id;
        $data['shot_number'] = $session->shots()->max('shot_number') + 1;
        $data['created_at'] = now();

        // Calculate extraction percent if TDS provided
        if (!empty($data['tds']) && !empty($data['dose']) && !empty($data['yield'])) {
            $data['extraction_percent'] = round(((float)$data['yield'] * (float)$data['tds']) / ((float)$data['dose'] * 100) * 100, 2);
        }

        $shot = CalibrationShot::create($data);

        // Check range against recipe target
        $espresso = $session->recipe?->espressoRecipe;
        if ($espresso) {
            $shot->checkRange((float)$espresso->tds, (int)$espresso->extraction_time);
            $shot->save();
        }

        // Recalculate session totals
        $session->recalculate();
        $session->save();

        return $shot;
    }

    public function finishSession(CalibrationSession $session): CalibrationSession
    {
        $session->recalculate();
        $session->update(['status' => CalibrationStatus::Completed]);

        // Record waste
        WasteRecord::firstOrCreate(
            ['source_type' => get_class($session), 'source_id' => $session->id],
            [
                'crop_id' => $session->crop_id,
                'waste_type' => 'calibration_waste',
                'weight_grams' => $session->total_waste_grams,
                'reason' => "Calibration: {$session->total_shots} shots",
                'created_by' => $session->barista_id,
                'created_at' => now(),
            ]
        );

        CalibrationCompleted::dispatch($session);

        return $session->fresh()->load('shots');
    }

    public function approveSession(CalibrationSession $session, int $approverId): CalibrationSession
    {
        $session->update([
            'status' => CalibrationStatus::Approved,
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);

        app(NotificationService::class)->sendToAdmins(
            'calibration_approved',
            "Calibration approved: {$session->total_shots} shots",
            "تم اعتماد المعايرة: {$session->total_shots} محاولة",
            null, null,
            '/stations/barista/calibration',
            get_class($session),
            $session->id,
        );

        return $session->fresh();
    }

    public function getBaristaStats(?int $branchId = null): array
    {
        $sessionsQuery = CalibrationSession::query();
        if ($branchId) {
            $sessionsQuery->where('branch_id', $branchId);
        }

        // Barista stats
        $baristas = (clone $sessionsQuery)
            ->join('users', 'calibration_sessions.barista_id', '=', 'users.id')
            ->selectRaw("
                calibration_sessions.barista_id as user_id,
                users.name,
                users.name_ar,
                COUNT(*) as total_sessions,
                COALESCE(SUM(calibration_sessions.total_shots), 0) as total_shots,
                ROUND(COALESCE(AVG(calibration_sessions.total_shots), 0), 1) as avg_shots_per_session,
                COALESCE(SUM(calibration_sessions.total_waste_grams), 0) as total_waste_grams
            ")
            ->groupBy('calibration_sessions.barista_id', 'users.name', 'users.name_ar')
            ->orderByDesc('total_sessions')
            ->get()
            ->map(fn ($r) => [
                'user_id' => $r->user_id,
                'name' => $r->name,
                'name_ar' => $r->name_ar,
                'total_sessions' => (int) $r->total_sessions,
                'total_shots' => (int) $r->total_shots,
                'avg_shots_per_session' => (float) $r->avg_shots_per_session,
                'total_waste_grams' => (float) $r->total_waste_grams,
            ]);

        // Branch stats
        $branchStats = CalibrationSession::query()
            ->join('branches', 'calibration_sessions.branch_id', '=', 'branches.id')
            ->selectRaw("
                calibration_sessions.branch_id,
                branches.name,
                branches.name_ar,
                COUNT(*) as total_sessions,
                COALESCE(SUM(calibration_sessions.total_waste_grams), 0) as total_waste
            ")
            ->when($branchId, fn ($q) => $q->where('calibration_sessions.branch_id', $branchId))
            ->groupBy('calibration_sessions.branch_id', 'branches.name', 'branches.name_ar')
            ->orderByDesc('total_sessions')
            ->get()
            ->map(fn ($r) => [
                'branch_id' => $r->branch_id,
                'name' => $r->name,
                'name_ar' => $r->name_ar,
                'total_sessions' => (int) $r->total_sessions,
                'total_waste' => (float) $r->total_waste,
            ]);

        // KPI: calibration waste percent = total calibration waste / total bar consumption * 100
        $totalCalibrationWaste = (float) WasteRecord::where('waste_type', 'calibration_waste')
            ->when($branchId, function ($q) use ($branchId) {
                $q->whereHas('source', fn ($sq) => $sq->where('branch_id', $branchId));
            })
            ->sum('weight_grams');

        // Total bar consumption = all calibration dose grams
        $totalBarConsumption = (float) CalibrationSession::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->sum('total_dose_grams');

        $calibrationWastePercent = $totalBarConsumption > 0
            ? round(($totalCalibrationWaste / $totalBarConsumption) * 100, 1)
            : 0;

        return [
            'baristas' => $baristas,
            'branch_stats' => $branchStats,
            'kpis' => [
                'calibration_waste_percent' => $calibrationWastePercent,
            ],
        ];
    }
}
