<?php

namespace App\Modules\Inventory\Enums;

enum MovementType: string
{
    // Incoming (IN)
    case Receiving = 'receiving';
    case RoastingIn = 'roasting_in';
    case PackagingIn = 'packaging_in';
    case TransferIn = 'transfer_in';
    case AdjustmentIn = 'adjustment_in';

    // Outgoing (OUT)
    case RoastingOut = 'roasting_out';
    case RoastLoss = 'roast_loss';
    case PackagingOut = 'packaging_out';
    case Sale = 'sale';
    case TransferOut = 'transfer_out';
    case CalibrationWaste = 'calibration_waste';
    case QcWaste = 'qc_waste';
    case TrialWaste = 'trial_waste';
    case CuppingWaste = 'cupping_waste';
    case AdjustmentOut = 'adjustment_out';

    // Reconciliation (direction depends on actual vs system)
    case Reconciliation = 'reconciliation';

    public function isIncoming(): bool
    {
        return in_array($this, [
            self::Receiving,
            self::RoastingIn,
            self::PackagingIn,
            self::TransferIn,
            self::AdjustmentIn,
        ]);
    }

    public function isOutgoing(): bool
    {
        return in_array($this, [
            self::RoastingOut,
            self::RoastLoss,
            self::PackagingOut,
            self::Sale,
            self::TransferOut,
            self::CalibrationWaste,
            self::QcWaste,
            self::TrialWaste,
            self::CuppingWaste,
            self::AdjustmentOut,
        ]);
    }

    public function label(): string
    {
        return match ($this) {
            self::Receiving => 'استلام بن أخضر',
            self::RoastingIn => 'إضافة بن محمص',
            self::PackagingIn => 'إضافة منتج نهائي',
            self::TransferIn => 'استلام تحويل',
            self::AdjustmentIn => 'تعديل يدوي (زيادة)',
            self::RoastingOut => 'سحب للتحميص',
            self::RoastLoss => 'فاقد تحميص',
            self::PackagingOut => 'سحب للتعبئة',
            self::Sale => 'بيع',
            self::TransferOut => 'تحويل للفرع',
            self::CalibrationWaste => 'هدر معايرة',
            self::QcWaste => 'هدر فحص جودة',
            self::TrialWaste => 'هدر تحميص تجريبي',
            self::CuppingWaste => 'هدر كبّينغ',
            self::AdjustmentOut => 'تعديل يدوي (نقص)',
            self::Reconciliation => 'تسوية جرد',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Receiving => 'Green Coffee Receiving',
            self::RoastingIn => 'Roasted Coffee In',
            self::PackagingIn => 'Finished Product In',
            self::TransferIn => 'Transfer In',
            self::AdjustmentIn => 'Manual Adjustment (In)',
            self::RoastingOut => 'Green Coffee to Roasting',
            self::RoastLoss => 'Roast Loss',
            self::PackagingOut => 'Roasted Coffee to Packaging',
            self::Sale => 'Sale',
            self::TransferOut => 'Transfer Out',
            self::CalibrationWaste => 'Calibration Waste',
            self::QcWaste => 'QC Waste',
            self::TrialWaste => 'Trial Roast Waste',
            self::CuppingWaste => 'Cupping Waste',
            self::AdjustmentOut => 'Manual Adjustment (Out)',
            self::Reconciliation => 'Stock Reconciliation',
        };
    }
}
