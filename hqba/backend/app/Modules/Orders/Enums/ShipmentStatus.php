<?php

namespace App\Modules\Orders\Enums;

enum ShipmentStatus: string
{
    case Pending = 'pending';
    case Picked = 'picked';
    case Packed = 'packed';
    case Shipped = 'shipped';
    case Delivered = 'delivered';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'معلق',
            self::Picked => 'تم التجميع',
            self::Packed => 'تم التعبئة',
            self::Shipped => 'تم الشحن',
            self::Delivered => 'تم التسليم',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Picked => 'Picked',
            self::Packed => 'Packed',
            self::Shipped => 'Shipped',
            self::Delivered => 'Delivered',
        };
    }
}
