<?php

namespace App\Modules\Inventory\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class InventoryAudit extends Model
{
    use LogsActivity;

    protected $fillable = [
        'branch_id', 'audit_type', 'status', 'opened_by', 'opened_at',
        'closed_by', 'closed_at', 'total_system_value', 'total_actual_value',
        'total_variance_value', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime', 'closed_at' => 'datetime',
            'total_system_value' => 'decimal:2', 'total_actual_value' => 'decimal:2',
            'total_variance_value' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status'])->logOnlyDirty();
    }

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function opener(): BelongsTo { return $this->belongsTo(User::class, 'opened_by'); }
    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'closed_by'); }
    public function items(): HasMany { return $this->hasMany(InventoryAuditItem::class); }
}
