<?php

namespace App\Modules\Pricing\Enums;

enum PriceListStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Active = 'active';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'بانتظار الاعتماد',
            self::Active => 'نشط',
            self::Archived => 'مؤرشف',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingApproval => 'Pending Approval',
            self::Active => 'Active',
            self::Archived => 'Archived',
        };
    }
}
