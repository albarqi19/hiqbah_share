<?php

namespace App\Modules\Production\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Production\Enums\PackagingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PackagingLot extends Model
{
    use LogsActivity;

    protected $fillable = [
        'lot_number', 'crop_id', 'roast_batch_id', 'packed_by', 'status',
        'package_size', 'bags_count', 'roasted_weight_used_kg', 'net_weight_per_bag_g',
        'total_net_weight_kg', 'packaging_waste_g', 'sku', 'qr_data', 'notes', 'packed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PackagingStatus::class,
            'qr_data' => 'array',
            'roasted_weight_used_kg' => 'decimal:2',
            'net_weight_per_bag_g' => 'decimal:2',
            'total_net_weight_kg' => 'decimal:2',
            'packaging_waste_g' => 'decimal:2',
            'packed_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status', 'bags_count'])->logOnlyDirty();
    }

    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function roastBatch(): BelongsTo { return $this->belongsTo(RoastBatch::class); }
    public function packer(): BelongsTo { return $this->belongsTo(User::class, 'packed_by'); }

    public static function generateLotNumber(): string
    {
        $year = now()->year;
        $last = static::where('lot_number', 'like', "PK-{$year}-%")->orderByDesc('lot_number')->first();
        $next = $last ? (int) substr($last->lot_number, -4) + 1 : 1;
        return sprintf('PK-%d-%04d', $year, $next);
    }

    public function itemType(): string
    {
        return match ($this->package_size) {
            '250' => 'finished_250',
            '500' => 'finished_500',
            '1000' => 'finished_1kg',
            default => 'finished_250',
        };
    }
}
