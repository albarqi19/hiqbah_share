<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\User;
use App\Modules\Orders\Models\Customer;
use App\Modules\Sales\Enums\LeadStage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Lead extends Model
{
    use LogsActivity;

    protected $fillable = [
        'company_name',
        'company_name_ar',
        'contact_name',
        'contact_name_ar',
        'email',
        'phone',
        'city',
        'address',
        'stage',
        'source',
        'notes',
        'estimated_monthly_kg',
        'sales_rep_id',
        'converted_customer_id',
        'contacted_at',
        'quoted_at',
        'converted_at',
        'lost_at',
        'lost_reason',
    ];

    protected function casts(): array
    {
        return [
            'stage' => LeadStage::class,
            'estimated_monthly_kg' => 'decimal:2',
            'contacted_at' => 'datetime',
            'quoted_at' => 'datetime',
            'converted_at' => 'datetime',
            'lost_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['stage', 'sales_rep_id', 'notes'])
            ->logOnlyDirty();
    }

    // ── Relationships ──

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function convertedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    // ── Scopes ──

    public function scopeByStage($query, LeadStage $stage)
    {
        return $query->where('stage', $stage);
    }

    public function scopeByRep($query, int $repId)
    {
        return $query->where('sales_rep_id', $repId);
    }
}
