<?php

namespace App\Modules\Crops\Enums;

enum GreenCoffeeLotStatus: string
{
    case Received = 'received';
    case Inspecting = 'inspecting';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Conditional = 'conditional';

    public function label(): string
    {
        return match ($this) {
            self::Received => 'مستلم',
            self::Inspecting => 'قيد الفحص',
            self::Approved => 'مقبول',
            self::Rejected => 'مرفوض',
            self::Conditional => 'مقبول بشرط',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Received => 'Received',
            self::Inspecting => 'Inspecting',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Conditional => 'Conditional',
        };
    }
}
