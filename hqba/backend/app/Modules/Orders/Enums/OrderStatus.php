<?php

namespace App\Modules\Orders\Enums;

enum OrderStatus: string
{
    case Draft = 'draft';
    case SalesReview = 'sales_review';
    case InventoryCheck = 'inventory_check';
    case Accounting = 'accounting';
    case SalesConfirm = 'sales_confirm';
    case PendingPayment = 'pending_payment';
    case Allocated = 'allocated';
    case InProduction = 'in_production';
    case Packing = 'packing';
    case PartiallyShipped = 'partially_shipped';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Closed = 'closed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'مسودة',
            self::SalesReview => 'مراجعة المبيعات',
            self::InventoryCheck => 'فحص المخزون',
            self::Accounting => 'المحاسبة',
            self::SalesConfirm => 'تأكيد المبيعات',
            self::PendingPayment => 'بانتظار الدفع',
            self::Allocated => 'تم التخصيص',
            self::InProduction => 'قيد الإنتاج',
            self::Packing => 'قيد التعبئة',
            self::PartiallyShipped => 'شحن جزئي',
            self::Shipped => 'تم الشحن',
            self::Delivered => 'تم التسليم',
            self::Closed => 'مغلق',
            self::Cancelled => 'ملغى',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::SalesReview => 'Sales Review',
            self::InventoryCheck => 'Inventory Check',
            self::Accounting => 'Accounting',
            self::SalesConfirm => 'Sales Confirm',
            self::PendingPayment => 'Pending Payment',
            self::Allocated => 'Allocated',
            self::InProduction => 'In Production',
            self::Packing => 'Packing',
            self::PartiallyShipped => 'Partially Shipped',
            self::Shipped => 'Shipped',
            self::Delivered => 'Delivered',
            self::Closed => 'Closed',
            self::Cancelled => 'Cancelled',
        };
    }

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::SalesReview, self::Cancelled],
            self::SalesReview => [self::InventoryCheck, self::Cancelled],
            self::InventoryCheck => [self::Accounting, self::Cancelled],
            self::Accounting => [self::SalesConfirm, self::Cancelled],
            self::SalesConfirm => [self::PendingPayment, self::Cancelled],
            self::PendingPayment => [self::Allocated, self::Cancelled],
            self::Allocated => [self::InProduction],
            self::InProduction => [self::Packing],
            self::Packing => [self::PartiallyShipped, self::Shipped],
            self::PartiallyShipped => [self::Shipped, self::PartiallyShipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [self::Closed],
            self::Closed => [],
            self::Cancelled => [],
        };
    }

    /**
     * Statuses that allow cancellation with stock release.
     */
    public function isCancellable(): bool
    {
        return in_array($this, [
            self::Draft,
            self::SalesReview,
            self::InventoryCheck,
            self::Accounting,
            self::SalesConfirm,
            self::PendingPayment,
            self::Allocated,
        ]);
    }
}
