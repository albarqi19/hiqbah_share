<?php

namespace App\Core\Enums;

enum BranchType: string
{
    case Roastery = 'roastery';
    case Branch = 'branch';

    public function label(): string
    {
        return match ($this) {
            self::Roastery => 'محمصة',
            self::Branch => 'فرع',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Roastery => 'Roastery',
            self::Branch => 'Branch',
        };
    }
}
