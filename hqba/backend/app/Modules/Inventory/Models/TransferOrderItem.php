<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Crops\Models\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferOrderItem extends Model
{
    protected $fillable = [
        'transfer_order_id', 'crop_id', 'item_type',
        'quantity_sent', 'quantity_received', 'quantity_variance',
    ];

    public function transferOrder(): BelongsTo { return $this->belongsTo(TransferOrder::class); }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
}
