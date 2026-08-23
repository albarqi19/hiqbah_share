<?php

namespace App\Modules\Crops\Enums;

enum CuppingDecision: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Retest = 'retest';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'معتمد',
            self::Rejected => 'مرفوض',
            self::Retest => 'إعادة اختبار',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Retest => 'Retest',
        };
    }
}
