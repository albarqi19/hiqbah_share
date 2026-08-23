<?php

namespace App\Modules\Procurement\Enums;

enum RequisitionStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Converted = 'converted';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'بانتظار الاعتماد',
            self::Approved => 'معتمد',
            self::Rejected => 'مرفوض',
            self::Converted => 'محوّل لأمر شراء',
            self::Cancelled => 'ملغى',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Converted => 'Converted to PO',
            self::Cancelled => 'Cancelled',
        };
    }

    /** @return array<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::PendingApproval, self::Cancelled],
            self::PendingApproval => [self::Approved, self::Rejected, self::Cancelled],
            self::Approved => [self::Converted, self::Cancelled],
            self::Rejected => [self::Draft, self::Cancelled],
            self::Converted => [],
            self::Cancelled => [],
        };
    }

    public function isEditable(): bool
    {
        return in_array($this, [self::Draft, self::Rejected]);
    }

    public function isCancellable(): bool
    {
        return in_array($this, [self::Draft, self::PendingApproval, self::Approved, self::Rejected]);
    }
}
