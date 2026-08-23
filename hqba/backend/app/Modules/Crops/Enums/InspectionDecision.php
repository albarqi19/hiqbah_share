<?php

namespace App\Modules\Crops\Enums;

enum InspectionDecision: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Conditional = 'conditional';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'مقبول',
            self::Rejected => 'مرفوض',
            self::Conditional => 'مقبول بشرط',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Conditional => 'Conditional',
        };
    }
}
