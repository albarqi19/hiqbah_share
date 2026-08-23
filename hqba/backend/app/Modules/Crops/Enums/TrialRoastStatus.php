<?php

namespace App\Modules\Crops\Enums;

enum TrialRoastStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Selected = 'selected';

    public function label(): string
    {
        return match ($this) {
            self::InProgress => 'قيد التنفيذ',
            self::Completed => 'مكتمل',
            self::Selected => 'مختار',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::InProgress => 'In Progress',
            self::Completed => 'Completed',
            self::Selected => 'Selected',
        };
    }
}
