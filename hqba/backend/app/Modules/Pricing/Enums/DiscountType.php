<?php

namespace App\Modules\Pricing\Enums;

enum DiscountType: string
{
    case Volume = 'volume';
    case Seasonal = 'seasonal';
    case CustomerSpecific = 'customer_specific';
    case Coupon = 'coupon';

    public function label(): string
    {
        return match ($this) {
            self::Volume => 'خصم كمية',
            self::Seasonal => 'خصم موسمي',
            self::CustomerSpecific => 'خصم عميل',
            self::Coupon => 'كوبون',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Volume => 'Volume Discount',
            self::Seasonal => 'Seasonal Discount',
            self::CustomerSpecific => 'Customer Specific',
            self::Coupon => 'Coupon',
        };
    }
}
