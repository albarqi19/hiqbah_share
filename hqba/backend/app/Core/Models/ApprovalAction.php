<?php

namespace App\Core\Models;

use App\Core\Enums\ApprovalActionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalAction extends Model
{
    protected $fillable = [
        'approval_request_id',
        'approver_id',
        'action',
        'step',
        'comment',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'action' => ApprovalActionType::class,
            'step' => 'integer',
            'acted_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
