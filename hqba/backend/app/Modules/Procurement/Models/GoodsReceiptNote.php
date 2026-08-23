<?php

namespace App\Modules\Procurement\Models;

use App\Core\Models\User;
use App\Modules\Procurement\Enums\GrnCondition;
use App\Modules\Procurement\Enums\GrnStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class GoodsReceiptNote extends Model
{
    use LogsActivity;

    protected $fillable = [
        'grn_number',
        'purchase_order_id',
        'received_by',
        'received_at',
        'bags_received',
        'total_weight_received',
        'expected_weight',
        'variance_weight',
        'variance_percent',
        'delivery_note_number',
        'carrier',
        'shipping_documents',
        'photos',
        'condition',
        'status',
        'qc_started_at',
        'qc_completed_by',
        'qc_completed_at',
        'qc_decision',
        'qc_moisture_percent',
        'qc_cupping_score',
        'qc_notes',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => GrnStatus::class,
            'condition' => GrnCondition::class,
            'received_at' => 'datetime',
            'qc_started_at' => 'datetime',
            'qc_completed_at' => 'datetime',
            'shipping_documents' => 'array',
            'photos' => 'array',
            'total_weight_received' => 'decimal:2',
            'expected_weight' => 'decimal:2',
            'variance_weight' => 'decimal:2',
            'variance_percent' => 'decimal:2',
            'qc_moisture_percent' => 'decimal:2',
            'qc_cupping_score' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['grn_number', 'status', 'qc_decision', 'total_weight_received'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function qcCompleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'qc_completed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(GoodsReceiptNoteItem::class);
    }

    // ── Helpers ──

    public static function generateGrnNumber(): string
    {
        $year = now()->year;
        $last = static::where('grn_number', 'like', "GRN-{$year}-%")
            ->orderByDesc('grn_number')
            ->first();

        $next = $last ? ((int) substr($last->grn_number, -4)) + 1 : 1;

        return sprintf('GRN-%d-%04d', $year, $next);
    }

    public function calculateVariance(): void
    {
        $variance = (float) $this->total_weight_received - (float) $this->expected_weight;
        $this->variance_weight = $variance;
        $this->variance_percent = $this->expected_weight > 0
            ? round(($variance / (float) $this->expected_weight) * 100, 2)
            : 0;
    }
}
