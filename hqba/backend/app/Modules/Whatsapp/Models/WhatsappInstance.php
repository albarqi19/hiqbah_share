<?php

namespace App\Modules\Whatsapp\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappInstance extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'phone_number',
        'status',
        'evolution_id',
        'token',
        'qr_code',
        'connected_at',
        'last_qr_at',
        'is_default',
        'metadata',
    ];

    protected $casts = [
        'connected_at' => 'datetime',
        'last_qr_at' => 'datetime',
        'is_default' => 'boolean',
        'metadata' => 'array',
    ];

    protected $hidden = ['token'];

    public function isConnected(): bool
    {
        return $this->status === 'open';
    }
}
