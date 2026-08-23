<?php

namespace App\Modules\Whatsapp\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WhatsappMessage extends Model
{
    protected $fillable = [
        'instance_id',
        'to_number',
        'direction',
        'message',
        'status',
        'event_type',
        'related_type',
        'related_id',
        'error',
        'response',
        'sent_at',
    ];

    protected $casts = [
        'response' => 'array',
        'sent_at' => 'datetime',
    ];

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WhatsappInstance::class, 'instance_id');
    }

    public function related(): MorphTo
    {
        return $this->morphTo();
    }
}
