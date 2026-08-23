<?php

namespace App\Modules\Sales\Enums;

enum CommissionStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Paid = 'paid';
    case Reversed = 'reversed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'معلقة',
            self::Approved => 'معتمدة',
            self::Paid => 'مدفوعة',
            self::Reversed => 'معكوسة',
            self::Cancelled => 'ملغاة',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Paid => 'Paid',
            self::Reversed => 'Reversed',
            self::Cancelled => 'Cancelled',
        };
    }
}
