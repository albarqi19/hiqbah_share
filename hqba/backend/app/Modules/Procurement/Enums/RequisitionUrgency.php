<?php

namespace App\Modules\Procurement\Enums;

enum RequisitionUrgency: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'منخفضة',
            self::Normal => 'عادية',
            self::High => 'عالية',
            self::Critical => 'حرجة',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Low => 'Low',
            self::Normal => 'Normal',
            self::High => 'High',
            self::Critical => 'Critical',
        };
    }
}
