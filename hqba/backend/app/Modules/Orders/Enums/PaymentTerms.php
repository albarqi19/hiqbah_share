<?php

namespace App\Modules\Orders\Enums;

enum PaymentTerms: string
{
    case Prepaid = 'prepaid';
    case Net15 = 'net_15';
    case Net30 = 'net_30';
    case Net60 = 'net_60';

    public function label(): string
    {
        return match ($this) {
            self::Prepaid => 'دفع مسبق',
            self::Net15 => 'صافي 15 يوم',
            self::Net30 => 'صافي 30 يوم',
            self::Net60 => 'صافي 60 يوم',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Prepaid => 'Prepaid',
            self::Net15 => 'Net 15',
            self::Net30 => 'Net 30',
            self::Net60 => 'Net 60',
        };
    }

    public function dueDays(): int
    {
        return match ($this) {
            self::Prepaid => 0,
            self::Net15 => 15,
            self::Net30 => 30,
            self::Net60 => 60,
        };
    }
}
