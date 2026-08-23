<?php

namespace App\Modules\Quality\Models;

use App\Core\Models\Branch;
use App\Core\Models\User;
use App\Modules\Crops\Models\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketFeedback extends Model
{
    protected $table = 'market_feedback';

    protected $fillable = [
        'crop_id', 'source', 'feedback_type', 'rating',
        'comment', 'customer_name', 'branch_id', 'created_by',
    ];

    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
