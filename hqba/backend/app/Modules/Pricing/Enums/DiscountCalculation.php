<?php

namespace App\Modules\Pricing\Enums;

enum DiscountCalculation: string
{
    case Percentage = 'percentage';
    case FixedAmount = 'fixed_amount';

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'نسبة مئوية',
            self::FixedAmount => 'مبلغ ثابت',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Percentage => 'Percentage',
            self::FixedAmount => 'Fixed Amount',
        };
    }

    public function calculate(float $value, float $subtotal): float
    {
        return match ($this) {
            self::Percentage => round($subtotal * ($value / 100), 2),
            self::FixedAmount => min($value, $subtotal),
        };
    }
}
