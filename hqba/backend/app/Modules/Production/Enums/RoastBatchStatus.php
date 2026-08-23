<?php

namespace App\Modules\Production\Enums;

enum RoastBatchStatus: string
{
    case Queued = 'queued';
    case Roasting = 'roasting';
    case Cooling = 'cooling';
    case PendingQc = 'pending_qc';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Queued => 'في الطابور',
            self::Roasting => 'جاري التحميص',
            self::Cooling => 'تبريد',
            self::PendingQc => 'بانتظار الفحص',
            self::Approved => 'مقبول',
            self::Rejected => 'مرفوض',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Queued => 'Queued',
            self::Roasting => 'Roasting',
            self::Cooling => 'Cooling',
            self::PendingQc => 'Pending QC',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }
}
