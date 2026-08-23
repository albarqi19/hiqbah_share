<?php

namespace App\Modules\Production\Services;

use App\Core\Services\NotificationService;
use App\Modules\Production\Enums\PackagingStatus;
use App\Modules\Production\Events\PackagingCompleted;
use App\Modules\Production\Models\PackagingLot;
use Illuminate\Support\Collection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PackagingService
{
    public function list()
    {
        return QueryBuilder::for(PackagingLot::class)
            ->allowedFilters([AllowedFilter::exact('status'), AllowedFilter::exact('crop_id')])
            ->allowedSorts(['created_at', 'bags_count'])
            ->allowedIncludes(['crop', 'roastBatch', 'packer'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function create(array $data): PackagingLot
    {
        $data['lot_number'] = PackagingLot::generateLotNumber();
        $data['status'] = PackagingStatus::Pending->value;
        $data['net_weight_per_bag_g'] = (float) $data['package_size'];
        $data['total_net_weight_kg'] = ($data['net_weight_per_bag_g'] * $data['bags_count']) / 1000;

        // Build QR traceability data
        $lot = PackagingLot::create($data);
        $lot->update([
            'qr_data' => [
                'lot' => $lot->lot_number,
                'crop' => $lot->crop?->serial_number,
                'batch' => $lot->roastBatch?->batch_number,
                'size' => $lot->package_size . 'g',
                'packed' => now()->toDateString(),
            ],
        ]);

        return $lot->load(['crop', 'roastBatch', 'packer']);
    }

    public function complete(PackagingLot $lot): PackagingLot
    {
        $lot->update([
            'status' => PackagingStatus::Completed,
            'packed_at' => now(),
        ]);

        PackagingCompleted::dispatch($lot);

        app(NotificationService::class)->sendToAdmins(
            'packaging_completed',
            "Packaging completed: {$lot->lot_number} ({$lot->bags_count} × {$lot->package_size}g)",
            "اكتملت التعبئة: {$lot->lot_number} ({$lot->bags_count} × {$lot->package_size}g)",
            null, null, '/packaging', get_class($lot), $lot->id,
        );

        return $lot->fresh()->load(['crop', 'roastBatch', 'packer']);
    }
}
