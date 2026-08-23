<?php

namespace App\Modules\Sales\Enums;

enum LeadStage: string
{
    case NewLead = 'new_lead';
    case Contacted = 'contacted';
    case Quoted = 'quoted';
    case Converted = 'converted';
    case Lost = 'lost';

    public function label(): string
    {
        return match ($this) {
            self::NewLead => 'عميل جديد',
            self::Contacted => 'تم التواصل',
            self::Quoted => 'تم عرض السعر',
            self::Converted => 'تم التحويل',
            self::Lost => 'خسارة',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::NewLead => 'New Lead',
            self::Contacted => 'Contacted',
            self::Quoted => 'Quoted',
            self::Converted => 'Converted',
            self::Lost => 'Lost',
        };
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::NewLead => [self::Contacted, self::Lost],
            self::Contacted => [self::Quoted, self::Lost],
            self::Quoted => [self::Converted, self::Lost, self::Contacted],
            self::Converted => [],
            self::Lost => [self::NewLead],
        };
    }
}
