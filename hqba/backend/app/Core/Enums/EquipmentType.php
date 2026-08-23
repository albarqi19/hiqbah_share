<?php

namespace App\Core\Enums;

enum EquipmentType: string
{
    case EspressoMachine = 'espresso_machine';
    case Grinder = 'grinder';
    case Brewer = 'brewer';
    case Roaster = 'roaster';

    public function label(): string
    {
        return match ($this) {
            self::EspressoMachine => 'ماكينة إسبريسو',
            self::Grinder => 'مطحنة',
            self::Brewer => 'أداة تحضير',
            self::Roaster => 'محمصة',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::EspressoMachine => 'Espresso Machine',
            self::Grinder => 'Grinder',
            self::Brewer => 'Brewer',
            self::Roaster => 'Roaster',
        };
    }
}
