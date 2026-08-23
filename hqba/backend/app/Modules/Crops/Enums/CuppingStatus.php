<?php

namespace App\Modules\Crops\Enums;

enum CuppingStatus: string
{
    case Scheduled = 'scheduled';
    case InProgress = 'in_progress';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'مجدول',
            self::InProgress => 'قيد التنفيذ',
            self::Completed => 'مكتمل',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Scheduled => 'Scheduled',
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
        };
    }
}
