<?php

namespace App\Modules\Procurement\Enums;

enum RequisitionDepartment: string
{
    case Roastery = 'roastery';
    case Sales = 'sales';
    case QualityControl = 'quality_control';
    case Marketing = 'marketing';
    case Branch = 'branch';

    public function label(): string
    {
        return match ($this) {
            self::Roastery => 'المحمصة',
            self::Sales => 'المبيعات',
            self::QualityControl => 'مراقبة الجودة',
            self::Marketing => 'التسويق',
            self::Branch => 'الفرع',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Roastery => 'Roastery',
            self::Sales => 'Sales',
            self::QualityControl => 'Quality Control',
            self::Marketing => 'Marketing',
            self::Branch => 'Branch',
        };
    }
}
