<?php

namespace App\Core\Enums;

enum ApprovalType: string
{
    case Sequential = 'sequential'; // step 1 first, then step 2, then step 3
    case Parallel = 'parallel';     // all approvers must approve, any order
    case AnyOne = 'any_one';        // any one of the approvers is enough

    public function label(): string
    {
        return match ($this) {
            self::Sequential => 'تسلسلي',
            self::Parallel => 'متوازي - يجب الكل',
            self::AnyOne => 'أي واحد يكفي',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Sequential => 'Sequential',
            self::Parallel => 'Parallel (all)',
            self::AnyOne => 'Any one',
        };
    }
}
