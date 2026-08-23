<?php

namespace App\Core\Enums;

enum ApprovalActionType: string
{
    case Approve = 'approve';
    case Reject = 'reject';

    public function label(): string
    {
        return match ($this) {
            self::Approve => 'اعتماد',
            self::Reject => 'رفض',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Approve => 'Approve',
            self::Reject => 'Reject',
        };
    }
}
