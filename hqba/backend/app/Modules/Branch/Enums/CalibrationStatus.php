<?php

namespace App\Modules\Branch\Enums;

enum CalibrationStatus: string
{
    case Open = 'open';
    case Completed = 'completed';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'مفتوح',
            self::Completed => 'مكتمل',
            self::Approved => 'معتمد',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::Completed => 'Completed',
            self::Approved => 'Approved',
        };
    }
}
