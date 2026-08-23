<?php

namespace App\Modules\Quality\Models;

use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use App\Modules\Orders\Models\Customer;
use App\Modules\Orders\Models\Order;
use App\Modules\Production\Models\RoastBatch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Complaint extends Model
{
    use LogsActivity;

    protected $fillable = [
        'customer_id', 'crop_id', 'roast_batch_id', 'order_id',
        'subject', 'description', 'severity', 'status',
        'investigation_notes', 'resolution', 'corrective_action',
        'created_by', 'assigned_to', 'resolved_by', 'resolved_at',
    ];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status', 'severity'])->logOnlyDirty();
    }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function roastBatch(): BelongsTo { return $this->belongsTo(RoastBatch::class); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function resolver(): BelongsTo { return $this->belongsTo(User::class, 'resolved_by'); }
}
