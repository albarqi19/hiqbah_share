<?php

namespace App\Modules\Pricing\Enums;

enum RoundingRule: string
{
    case NearestHalala = 'nearest_halala';
    case NearestRiyal = 'nearest_riyal';
    case NearestFive = 'nearest_5';
    case None = 'none';

    public function label(): string
    {
        return match ($this) {
            self::NearestHalala => 'أقرب هللة',
            self::NearestRiyal => 'أقرب ريال',
            self::NearestFive => 'أقرب 5 ريال',
            self::None => 'بدون تقريب',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::NearestHalala => 'Nearest Halala',
            self::NearestRiyal => 'Nearest Riyal',
            self::NearestFive => 'Nearest 5 SAR',
            self::None => 'No Rounding',
        };
    }

    public function apply(float $amount): float
    {
        return match ($this) {
            self::NearestHalala => round($amount, 2),
            self::NearestRiyal => round($amount, 0),
            self::NearestFive => round($amount / 5, 0) * 5,
            self::None => $amount,
        };
    }
}
