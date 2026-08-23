<?php

namespace App\Modules\Quality\Services;

use App\Core\Services\NotificationService;
use App\Modules\Quality\Models\Complaint;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ComplaintService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Complaint::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('severity'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::exact('crop_id'),
            ])
            ->allowedSorts(['created_at', 'severity', 'status'])
            ->allowedIncludes(['customer', 'crop', 'roastBatch', 'order', 'creator', 'assignee'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function create(array $data): Complaint
    {
        $complaint = Complaint::create($data);

        app(NotificationService::class)->sendToAdmins(
            'complaint_created',
            "New complaint: {$complaint->subject}",
            "شكوى جديدة: {$complaint->subject}",
            null, null, '/complaints', get_class($complaint), $complaint->id,
        );

        return $complaint->load(['customer', 'crop', 'creator']);
    }

    public function investigate(Complaint $complaint, string $notes, int $assigneeId): Complaint
    {
        $complaint->update([
            'status' => 'investigating',
            'investigation_notes' => $notes,
            'assigned_to' => $assigneeId,
        ]);
        return $complaint->fresh();
    }

    public function resolve(Complaint $complaint, string $resolution, int $userId): Complaint
    {
        $complaint->update([
            'status' => 'resolved',
            'resolution' => $resolution,
            'resolved_by' => $userId,
            'resolved_at' => now(),
        ]);
        return $complaint->fresh();
    }
}
