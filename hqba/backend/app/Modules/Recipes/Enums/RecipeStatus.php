<?php

namespace App\Modules\Recipes\Enums;

enum RecipeStatus: string
{
    case Draft = 'draft';
    case Calibrating = 'calibrating';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Published = 'published';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::Calibrating => 'معايرة',
            self::PendingApproval => 'بانتظار الاعتماد',
            self::Approved => 'معتمد',
            self::Published => 'منشور',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Calibrating => 'Calibrating',
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved',
            self::Published => 'Published',
        };
    }
}
