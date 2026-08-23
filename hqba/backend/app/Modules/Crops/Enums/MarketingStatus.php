<?php

namespace App\Modules\Crops\Enums;

enum MarketingStatus: string
{
    case Draft = 'draft';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::Approved => 'معتمد',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Approved => 'Approved',
        };
    }
}
