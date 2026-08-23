<?php

namespace App\Modules\Recipes\Enums;

enum RecipeType: string
{
    case Espresso = 'espresso';
    case PourOver = 'pour_over';

    public function label(): string
    {
        return match ($this) {
            self::Espresso => 'إسبريسو',
            self::PourOver => 'دريب (تقطير)',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Espresso => 'Espresso',
            self::PourOver => 'Pour Over',
        };
    }
}
