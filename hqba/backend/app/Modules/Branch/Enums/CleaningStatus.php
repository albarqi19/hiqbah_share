<?php

namespace App\Modules\Branch\Enums;

enum CleaningStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Reviewed = 'reviewed';
    case Overdue = 'overdue';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'منتظر',
            self::InProgress => 'جاري',
            self::Completed => 'مكتمل',
            self::Reviewed => 'تمت المراجعة',
            self::Overdue => 'متأخر',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
            self::Reviewed => 'Reviewed',
            self::Overdue => 'Overdue',
        };
    }
}
