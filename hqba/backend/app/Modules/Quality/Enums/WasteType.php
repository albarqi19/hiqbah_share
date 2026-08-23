<?php

namespace App\Modules\Quality\Enums;

enum WasteType: string
{
    case TrialRoastSample = 'trial_roast_sample';
    case CuppingWaste = 'cupping_waste';
    case RoastLoss = 'roast_loss';
    case QcSample = 'qc_sample';
    case CalibrationWaste = 'calibration_waste';

    public function label(): string
    {
        return match ($this) {
            self::TrialRoastSample => 'عينة تحميص تجريبي',
            self::CuppingWaste => 'هدر تقييم',
            self::RoastLoss => 'فاقد تحميص',
            self::QcSample => 'عينة فحص جودة',
            self::CalibrationWaste => 'هدر معايرة',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::TrialRoastSample => 'Trial Roast Sample',
            self::CuppingWaste => 'Cupping Waste',
            self::RoastLoss => 'Roast Loss',
            self::QcSample => 'QC Sample',
            self::CalibrationWaste => 'Calibration Waste',
        };
    }
}
