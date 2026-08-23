<?php

namespace App\Modules\Orders\Enums;

enum AllocationStatus: string
{
    case Reserved = 'reserved';
    case Picked = 'picked';
    case Released = 'released';

    public function label(): string
    {
        return match ($this) {
            self::Reserved => 'محجوز',
            self::Picked => 'تم التجميع',
            self::Released => 'محرر',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Reserved => 'Reserved',
            self::Picked => 'Picked',
            self::Released => 'Released',
        };
    }
}
