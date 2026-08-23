<?php

namespace App\Modules\Crops\Enums;

enum CropStatus: string
{
    case Ordered = 'ordered';
    case Received = 'received';
    case Inspecting = 'inspecting';
    case TrialRoasting = 'trial_roasting';
    case Cupping = 'cupping';
    case Approved = 'approved';
    case Pricing = 'pricing';
    case Marketing = 'marketing';
    case ProductionReady = 'production_ready';
    case InProduction = 'in_production';
    case Depleted = 'depleted';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Ordered => 'طلب',
            self::Received => 'مستلم',
            self::Inspecting => 'فحص',
            self::TrialRoasting => 'تحميص تجريبي',
            self::Cupping => 'تقييم',
            self::Approved => 'معتمد',
            self::Pricing => 'تسعير',
            self::Marketing => 'تسويق',
            self::ProductionReady => 'جاهز للإنتاج',
            self::InProduction => 'قيد الإنتاج',
            self::Depleted => 'نفد',
            self::Closed => 'مغلق',
        };
    }

    public function labelEn(): string
    {
        return match ($this) {
            self::Ordered => 'Ordered',
            self::Received => 'Received',
            self::Inspecting => 'Inspecting',
            self::TrialRoasting => 'Trial Roasting',
            self::Cupping => 'Cupping',
            self::Approved => 'Approved',
            self::Pricing => 'Pricing',
            self::Marketing => 'Marketing',
            self::ProductionReady => 'Production Ready',
            self::InProduction => 'In Production',
            self::Depleted => 'Depleted',
            self::Closed => 'Closed',
        };
    }
}
