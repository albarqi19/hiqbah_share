<?php

namespace App\Modules\Recipes\Enums;

enum BrewType: string
{
    case Hot = 'hot';
    case Iced = 'iced';

    public function label(): string
    {
        return match ($this) {
            self::Hot => 'ساخن',
            self::Iced => 'مثلج',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Hot => 'Hot',
            self::Iced => 'Iced',
        };
    }
}
