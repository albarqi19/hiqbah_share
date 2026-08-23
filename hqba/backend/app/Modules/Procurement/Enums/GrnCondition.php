<?php

namespace App\Modules\Procurement\Enums;

enum GrnCondition: string
{
    case Good = 'good';
    case Damaged = 'damaged';
    case Partial = 'partial';

    public function label(): string
    {
        return match ($this) {
            self::Good => 'سليمة',
            self::Damaged => 'تالفة',
            self::Partial => 'جزئية',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Good => 'Good',
            self::Damaged => 'Damaged',
            self::Partial => 'Partial',
        };
    }
}
