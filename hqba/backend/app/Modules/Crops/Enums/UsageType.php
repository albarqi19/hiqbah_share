<?php

namespace App\Modules\Crops\Enums;

enum UsageType: string
{
    case Espresso = 'espresso';
    case Filter = 'filter';
    case Both = 'both';

    public function label(): string
    {
        return match ($this) {
            self::Espresso => 'إسبريسو',
            self::Filter => 'فلتر',
            self::Both => 'كلاهما',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Espresso => 'Espresso',
            self::Filter => 'Filter',
            self::Both => 'Both',
        };
    }
}
