<?php

namespace App\Modules\Crops\Enums;

enum RoastLevel: string
{
    case Light = 'light';
    case MediumLight = 'medium_light';
    case Medium = 'medium';
    case MediumDark = 'medium_dark';
    case Dark = 'dark';

    public function label(): string
    {
        return match ($this) {
            self::Light => 'فاتح',
            self::MediumLight => 'فاتح متوسط',
            self::Medium => 'متوسط',
            self::MediumDark => 'متوسط غامق',
            self::Dark => 'غامق',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Light => 'Light',
            self::MediumLight => 'Medium Light',
            self::Medium => 'Medium',
            self::MediumDark => 'Medium Dark',
            self::Dark => 'Dark',
        };
    }
}
