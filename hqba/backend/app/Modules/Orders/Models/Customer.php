<?php

namespace App\Modules\Orders\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use App\Modules\Pricing\Models\PriceList;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Customer extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name', 'name_ar', 'type', 'branch_id', 'company',
        'email', 'phone', 'address', 'city', 'tax_number', 'is_active', 'notes',
        'sales_rep_id', 'price_list_id', 'payment_terms', 'credit_limit', 'customer_tier',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'credit_limit' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['name', 'is_active', 'sales_rep_id'])->logOnlyDirty();
    }

    // ── Relationships ──

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }

    public function salesRep(): BelongsTo { return $this->belongsTo(User::class, 'sales_rep_id'); }

    public function priceList(): BelongsTo { return $this->belongsTo(PriceList::class); }

    public function orders(): HasMany { return $this->hasMany(Order::class); }

    // ── Scopes ──

    public function scopeActive($query) { return $query->where('is_active', true); }
    public function scopeExternal($query) { return $query->where('type', 'external'); }
    public function scopeInternal($query) { return $query->where('type', 'internal'); }
    public function scopeByRep($query, int $repId) { return $query->where('sales_rep_id', $repId); }

    public function isInternal(): bool { return $this->type === 'internal'; }
}
