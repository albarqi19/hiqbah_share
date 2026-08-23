<?php

namespace App\Modules\Procurement\Enums;

enum PurchaseOrderStatus: string
{
    case Draft = 'draft';
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Ordered = 'ordered';
    case Shipped = 'shipped';
    case InTransit = 'in_transit';
    case InCustoms = 'in_customs';
    case Received = 'received';                       // GRN created
    case QualityCheck = 'quality_check';              // QC in progress
    case Accepted = 'accepted';                        // QC passed → entered inventory
    case ConditionallyAccepted = 'conditionally_accepted'; // QC passed with conditions
    case Rejected = 'rejected';                        // QC failed → returned to supplier
    case Closed = 'closed';                            // payment done, archived
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::PendingApproval => 'بانتظار الاعتماد',
            self::Approved => 'معتمد',
            self::Ordered => 'تم الطلب',
            self::Shipped => 'تم الشحن',
            self::InTransit => 'في الطريق',
            self::InCustoms => 'في الجمارك',
            self::Received => 'تم الاستلام',
            self::QualityCheck => 'فحص الجودة',
            self::Accepted => 'مقبول',
            self::ConditionallyAccepted => 'مقبول بشرط',
            self::Rejected => 'مرفوض',
            self::Closed => 'مغلق',
            self::Cancelled => 'ملغى',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingApproval => 'Pending Approval',
            self::Approved => 'Approved',
            self::Ordered => 'Ordered',
            self::Shipped => 'Shipped',
            self::InTransit => 'In Transit',
            self::InCustoms => 'In Customs',
            self::Received => 'Received',
            self::QualityCheck => 'Quality Check',
            self::Accepted => 'Accepted',
            self::ConditionallyAccepted => 'Conditionally Accepted',
            self::Rejected => 'Rejected',
            self::Closed => 'Closed',
            self::Cancelled => 'Cancelled',
        };
    }

    /** @return array<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::PendingApproval, self::Cancelled],
            self::PendingApproval => [self::Approved, self::Draft, self::Cancelled],
            self::Approved => [self::Ordered, self::Cancelled],
            self::Ordered => [self::Shipped, self::Cancelled],
            self::Shipped => [self::InTransit, self::InCustoms, self::Received],
            self::InTransit => [self::InCustoms, self::Received],
            self::InCustoms => [self::Received],
            self::Received => [self::QualityCheck, self::Rejected],
            self::QualityCheck => [self::Accepted, self::ConditionallyAccepted, self::Rejected],
            self::Accepted, self::ConditionallyAccepted => [self::Closed],
            self::Rejected => [self::Closed, self::Cancelled],
            self::Closed, self::Cancelled => [],
        };
    }

    public function isCancellable(): bool
    {
        return in_array($this, [
            self::Draft,
            self::PendingApproval,
            self::Approved,
            self::Ordered,
            self::Rejected,
        ]);
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Closed, self::Cancelled]);
    }
}
