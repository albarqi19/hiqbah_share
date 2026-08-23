<?php

namespace App\Modules\Pricing\Enums;

enum PriceListType: string
{
    case Wholesale = 'wholesale';
    case Retail = 'retail';
    case Vip = 'vip';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Wholesale => 'جملة',
            self::Retail => 'تجزئة',
            self::Vip => 'VIP',
            self::Custom => 'مخصص',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Wholesale => 'Wholesale',
            self::Retail => 'Retail',
            self::Vip => 'VIP',
            self::Custom => 'Custom',
        };
    }
}
