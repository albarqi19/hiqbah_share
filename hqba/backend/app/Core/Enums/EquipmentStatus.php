<?php

namespace App\Core\Enums;

enum EquipmentStatus: string
{
    case Active = 'active';
    case Maintenance = 'maintenance';
    case Inactive = 'inactive';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'فعّال',
            self::Maintenance => 'صيانة',
            self::Inactive => 'معطّل',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Maintenance => 'Maintenance',
            self::Inactive => 'Inactive',
        };
    }
}
