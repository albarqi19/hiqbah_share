<?php

namespace App\Core\Enums;

enum ApprovalRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'بانتظار الاعتماد',
            self::Approved => 'معتمد',
            self::Rejected => 'مرفوض',
            self::Cancelled => 'ملغى',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Cancelled => 'Cancelled',
        };
    }

    public function isFinal(): bool
    {
        return $this !== self::Pending;
    }
}
