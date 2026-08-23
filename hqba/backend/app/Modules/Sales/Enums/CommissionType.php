<?php

namespace App\Modules\Sales\Enums;

enum CommissionType: string
{
    case Percentage = 'percentage';
    case FixedPerOrder = 'fixed_per_order';
    case FixedPerKg = 'fixed_per_kg';

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'نسبة مئوية',
            self::FixedPerOrder => 'مبلغ ثابت لكل طلب',
            self::FixedPerKg => 'مبلغ ثابت لكل كيلو',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Percentage => 'Percentage',
            self::FixedPerOrder => 'Fixed Per Order',
            self::FixedPerKg => 'Fixed Per Kg',
        };
    }
}
