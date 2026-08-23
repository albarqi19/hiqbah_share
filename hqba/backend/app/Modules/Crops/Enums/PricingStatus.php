<?php

namespace App\Modules\Crops\Enums;

enum PricingStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'بانتظار الاعتماد',
            self::Approved => 'معتمد',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved',
        };
    }
}
