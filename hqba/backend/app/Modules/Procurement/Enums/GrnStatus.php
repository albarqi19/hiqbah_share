<?php

namespace App\Modules\Procurement\Enums;

enum GrnStatus: string
{
    case Received = 'received';            // وصلت البضاعة، الوزن مسجّل
    case PendingQc = 'pending_qc';         // بانتظار فحص الجودة
    case Accepted = 'accepted';            // مقبولة
    case ConditionallyAccepted = 'conditionally_accepted'; // مقبولة بشرط (سعر مخفض، إلخ)
    case Rejected = 'rejected';            // مرفوضة - تُعاد للمورد

    public function label(): string
    {
        return match ($this) {
            self::Received => 'تم الاستلام',
            self::PendingQc => 'بانتظار فحص الجودة',
            self::Accepted => 'مقبول',
            self::ConditionallyAccepted => 'مقبول بشرط',
            self::Rejected => 'مرفوض',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Received => 'Received',
            self::PendingQc => 'Pending QC',
            self::Accepted => 'Accepted',
            self::ConditionallyAccepted => 'Conditionally Accepted',
            self::Rejected => 'Rejected',
        };
    }

    /** @return array<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Received => [self::PendingQc, self::Rejected],
            self::PendingQc => [self::Accepted, self::ConditionallyAccepted, self::Rejected],
            self::Accepted, self::ConditionallyAccepted, self::Rejected => [],
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Accepted, self::ConditionallyAccepted, self::Rejected]);
    }
}
