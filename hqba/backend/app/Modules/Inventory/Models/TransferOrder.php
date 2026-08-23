<?php

namespace App\Modules\Inventory\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use App\Modules\Inventory\Enums\TransferStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TransferOrder extends Model
{
    use LogsActivity;

    protected $fillable = [
        'transfer_number', 'from_branch_id', 'to_branch_id', 'created_by',
        'approved_by', 'status', 'approved_at', 'shipped_at', 'received_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => TransferStatus::class,
            'approved_at' => 'datetime',
            'shipped_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status'])->logOnlyDirty();
    }

    public function fromBranch(): BelongsTo { return $this->belongsTo(Branch::class, 'from_branch_id'); }
    public function toBranch(): BelongsTo { return $this->belongsTo(Branch::class, 'to_branch_id'); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function approver(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function items(): HasMany { return $this->hasMany(TransferOrderItem::class); }

    public static function generateTransferNumber(): string
    {
        $year = now()->year;
        $last = static::where('transfer_number', 'like', "TF-{$year}-%")->orderByDesc('transfer_number')->first();
        $next = $last ? (int) substr($last->transfer_number, -4) + 1 : 1;
        return sprintf('TF-%d-%04d', $year, $next);
    }
}
