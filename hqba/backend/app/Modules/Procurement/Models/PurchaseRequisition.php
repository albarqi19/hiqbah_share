<?php

namespace App\Modules\Procurement\Models;

use App\Core\Models\User;
use App\Modules\Procurement\Enums\RequisitionDepartment;
use App\Modules\Procurement\Enums\RequisitionStatus;
use App\Modules\Procurement\Enums\RequisitionUrgency;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PurchaseRequisition extends Model
{
    use LogsActivity;

    protected $fillable = [
        'requisition_number',
        'requested_by',
        'department',
        'urgency',
        'target_quantity_kg',
        'target_price_per_kg',
        'target_origin_country',
        'target_region',
        'target_process',
        'target_variety',
        'preferred_supplier_id',
        'needed_by',
        'justification',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'converted_to_po_id',
        'converted_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => RequisitionStatus::class,
            'department' => RequisitionDepartment::class,
            'urgency' => RequisitionUrgency::class,
            'target_quantity_kg' => 'decimal:2',
            'target_price_per_kg' => 'decimal:2',
            'needed_by' => 'date',
            'approved_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['requisition_number', 'status', 'department', 'urgency', 'target_quantity_kg'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'converted_to_po_id');
    }

    // ── Scopes ──

    public function scopeStatus($query, RequisitionStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDepartment($query, RequisitionDepartment $dept)
    {
        return $query->where('department', $dept);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', RequisitionStatus::PendingApproval);
    }

    // ── Helpers ──

    public static function generateRequisitionNumber(): string
    {
        $year = now()->year;
        $last = static::where('requisition_number', 'like', "REQ-{$year}-%")
            ->orderByDesc('requisition_number')
            ->first();

        $next = $last ? ((int) substr($last->requisition_number, -4)) + 1 : 1;

        return sprintf('REQ-%d-%04d', $year, $next);
    }

    public function estimatedValue(): float
    {
        if (! $this->target_price_per_kg) {
            return 0.0;
        }

        return (float) $this->target_quantity_kg * (float) $this->target_price_per_kg;
    }
}
