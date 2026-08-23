<?php

namespace App\Modules\Production\Enums;

enum PackagingStatus: string
{
    case Pending = 'pending';
    case Packed = 'packed';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'قيد التحضير',
            self::Packed => 'تم التعبئة',
            self::Completed => 'مكتمل',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Packed => 'Packed',
            self::Completed => 'Completed',
        };
    }
}
