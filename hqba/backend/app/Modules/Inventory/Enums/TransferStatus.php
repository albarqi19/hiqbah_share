<?php

namespace App\Modules\Inventory\Enums;

enum TransferStatus: string
{
    case Draft = 'draft';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Received = 'received';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::Approved => 'معتمد',
            self::Shipped => 'تم الشحن',
            self::Received => 'تم الاستلام',
            self::Confirmed => 'مؤكد',
            self::Cancelled => 'ملغى',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Approved => 'Approved',
            self::Shipped => 'Shipped',
            self::Received => 'Received',
            self::Confirmed => 'Confirmed',
            self::Cancelled => 'Cancelled',
        };
    }
}
