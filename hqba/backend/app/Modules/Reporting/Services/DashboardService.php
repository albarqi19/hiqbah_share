<?php

namespace App\Modules\Reporting\Services;

use App\Modules\Crops\Models\Crop;
use App\Modules\Crops\Models\CuppingSession;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryMovement;
use App\Modules\Orders\Models\Order;
use App\Modules\Production\Models\RoastBatch;
use App\Modules\Quality\Models\Complaint;
use App\Modules\Quality\Models\WasteRecord;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class DashboardService
{
    public function getAdminDashboard(): array
    {
        return [
            'kpis' => $this->getKpis(),
            'charts' => $this->getCharts(),
            'recent_activities' => $this->getRecentActivities(),
            'alerts' => $this->getAlerts(),
        ];
    }

    protected function getKpis(): array
    {
        $today = today();
        $monthStart = now()->startOfMonth();

        return [
            'active_crops' => Crop::whereNull('closed_at')->count(),
            'orders_today' => Order::whereDate('created_at', $today)->count(),
            'revenue_month' => (float) Order::where('status', 'shipped')
                ->where('payment_status', 'paid')
                ->where('created_at', '>=', $monthStart)
                ->sum('total'),
            'low_stock_count' => InventoryItem::whereNotNull('min_threshold')
                ->whereColumn('quantity', '<=', 'min_threshold')->count(),
            'roast_batches_today' => RoastBatch::whereDate('created_at', $today)->count(),
            'waste_today_grams' => (float) WasteRecord::whereDate('created_at', $today)->sum('weight_grams'),
            'total_inventory_items' => InventoryItem::where('quantity', '>', 0)->count(),
            'pending_orders' => Order::whereNotIn('status', ['shipped', 'closed', 'cancelled'])->count(),
        ];
    }

    protected function getCharts(): array
    {
        // Monthly sales (last 6 months)
        $monthlySales = Order::where('status', 'shipped')
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => ['month' => $r->month, 'total' => (float) $r->total]);

        // Weekly production (last 4 weeks)
        $weeklyProduction = RoastBatch::whereIn('status', ['approved', 'pending_qc'])
            ->where('created_at', '>=', now()->subWeeks(4))
            ->selectRaw("TO_CHAR(created_at, 'IYYY-IW') as week, SUM(roasted_weight_kg) as total_kg, COUNT(*) as batches")
            ->groupBy('week')
            ->orderBy('week')
            ->get()
            ->map(fn ($r) => ['week' => $r->week, 'total_kg' => (float) $r->total_kg, 'batches' => $r->batches]);

        // Waste by type
        $wasteByType = WasteRecord::selectRaw("waste_type, SUM(weight_grams) as total_grams")
            ->groupBy('waste_type')
            ->get()
            ->map(fn ($r) => ['type' => $r->waste_type, 'grams' => (float) $r->total_grams]);

        return [
            'monthly_sales' => $monthlySales,
            'weekly_production' => $weeklyProduction,
            'waste_by_type' => $wasteByType,
        ];
    }

    protected function getRecentActivities(): array
    {
        return Activity::with('causer')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'description' => $a->description,
                'subject_type' => class_basename($a->subject_type ?? ''),
                'causer' => $a->causer?->name ?? 'System',
                'properties' => $a->properties,
                'created_at' => $a->created_at->toISOString(),
            ])
            ->toArray();
    }

    protected function getAlerts(): array
    {
        $alerts = [];

        // Low stock
        $lowStock = InventoryItem::with(['crop', 'branch'])
            ->whereNotNull('min_threshold')
            ->whereColumn('quantity', '<=', 'min_threshold')
            ->limit(5)->get();

        foreach ($lowStock as $item) {
            $alerts[] = [
                'type' => 'low_stock',
                'message' => "Low stock: {$item->crop?->serial_number} ({$item->item_type->value}) at {$item->branch?->name}",
                'severity' => 'warning',
            ];
        }

        // Pending orders
        $pendingOrders = Order::whereIn('status', ['draft', 'sales_review'])->count();
        if ($pendingOrders > 0) {
            $alerts[] = [
                'type' => 'pending_orders',
                'message' => "{$pendingOrders} orders awaiting review",
                'severity' => 'info',
            ];
        }

        return $alerts;
    }

    public function getQualityDashboard(): array
    {
        $monthStart = now()->startOfMonth();

        $approvedBatches = RoastBatch::where('status', 'approved')->count();
        $rejectedBatches = RoastBatch::where('status', 'rejected')->count();
        $totalDecided = $approvedBatches + $rejectedBatches;

        $batchPassRate = $totalDecided > 0
            ? round(($approvedBatches / $totalDecided) * 100, 1)
            : 0;

        $averageCuppingScore = (float) CuppingSession::whereNotNull('final_score')
            ->avg('final_score') ?? 0;

        $totalComplaints = Complaint::where('created_at', '>=', $monthStart)->count();

        $totalWasteKg = round(
            (float) WasteRecord::where('created_at', '>=', $monthStart)->sum('weight_grams') / 1000,
            2
        );

        // Roast consistency: std deviation of roast_loss_percent from recent 50 batches
        $recentLosses = RoastBatch::whereNotNull('roast_loss_percent')
            ->orderByDesc('created_at')
            ->limit(50)
            ->pluck('roast_loss_percent')
            ->map(fn ($v) => (float) $v);

        $roastConsistency = 0;
        if ($recentLosses->count() > 1) {
            $mean = $recentLosses->avg();
            $variance = $recentLosses->map(fn ($v) => pow($v - $mean, 2))->avg();
            $roastConsistency = round(sqrt($variance), 2);
        }

        // Batches by status
        $batchesByStatus = RoastBatch::selectRaw("status, COUNT(*) as count")
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => $r->count]);

        // Waste by type
        $wasteByType = WasteRecord::selectRaw("waste_type, SUM(weight_grams) as total_grams")
            ->groupBy('waste_type')
            ->get()
            ->map(fn ($r) => [
                'waste_type' => $r->waste_type instanceof \BackedEnum ? $r->waste_type->value : $r->waste_type,
                'total_grams' => (float) $r->total_grams,
            ]);

        // Complaints by month (last 6 months)
        $complaintsByMonth = Complaint::where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => ['month' => $r->month, 'count' => $r->count]);

        // Cupping scores trend (last 10 sessions with final_score)
        $cuppingScoresTrend = CuppingSession::whereNotNull('final_score')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'final_score', 'created_at'])
            ->reverse()
            ->values()
            ->map(fn ($s) => [
                'id' => $s->id,
                'score' => (float) $s->final_score,
                'date' => $s->created_at->format('Y-m-d'),
            ]);

        return [
            'batch_pass_rate' => $batchPassRate,
            'average_cupping_score' => round($averageCuppingScore, 1),
            'total_complaints' => $totalComplaints,
            'total_waste_kg' => $totalWasteKg,
            'roast_consistency' => $roastConsistency,
            'batches_by_status' => $batchesByStatus,
            'waste_by_type' => $wasteByType,
            'complaints_by_month' => $complaintsByMonth,
            'cupping_scores_trend' => $cuppingScoresTrend,
        ];
    }
}
