<?php

namespace App\Modules\Pricing\Services;

use App\Modules\Crops\Models\CropPricing;
use App\Modules\Orders\Models\Customer;
use App\Modules\Pricing\Enums\PriceListStatus;
use App\Modules\Pricing\Models\PriceChangeLog;
use App\Modules\Pricing\Models\PriceList;
use App\Modules\Pricing\Models\PriceListItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PricingService
{
    // ── Price List CRUD ──

    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(PriceList::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
            ])
            ->allowedSorts(['name', 'created_at', 'status', 'type'])
            ->allowedIncludes(['createdBy', 'approvedBy'])
            ->withCount('items')
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): PriceList
    {
        if (! empty($data['is_default'])) {
            $this->clearDefaultForType($data['type']);
        }

        return PriceList::create($data);
    }

    public function update(PriceList $priceList, array $data): PriceList
    {
        if (! empty($data['is_default']) && ! $priceList->is_default) {
            $this->clearDefaultForType($priceList->type->value);
        }

        $priceList->update($data);

        return $priceList->fresh();
    }

    public function approve(PriceList $priceList, int $userId): PriceList
    {
        if ($priceList->status !== PriceListStatus::PendingApproval && $priceList->status !== PriceListStatus::Draft) {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن اعتماد قائمة أسعار بحالة ' . $priceList->status->label()],
            ]);
        }

        $priceList->update([
            'status' => PriceListStatus::Active,
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);

        return $priceList->fresh();
    }

    public function archive(PriceList $priceList): PriceList
    {
        $priceList->update([
            'status' => PriceListStatus::Archived,
            'is_active' => false,
        ]);

        return $priceList->fresh();
    }

    // ── Price List Items ──

    public function listItems(PriceList $priceList): LengthAwarePaginator
    {
        return QueryBuilder::for(PriceListItem::where('price_list_id', $priceList->id))
            ->allowedFilters([
                AllowedFilter::exact('crop_id'),
                AllowedFilter::exact('item_type'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['unit_price', 'created_at', 'effective_from'])
            ->allowedIncludes(['crop'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    public function setItemPrice(PriceList $priceList, array $data): PriceListItem
    {
        $this->validateNoOverlap($priceList->id, $data);

        $oldItem = PriceListItem::where('price_list_id', $priceList->id)
            ->where('crop_id', $data['crop_id'])
            ->where('item_type', $data['item_type'])
            ->effectiveOn()
            ->first();

        $item = PriceListItem::create([
            'price_list_id' => $priceList->id,
            ...$data,
        ]);

        if ($oldItem && $oldItem->unit_price != $data['unit_price']) {
            $this->logChange('price_list_item', $item->id, [
                ['field' => 'unit_price', 'old_value' => $oldItem->unit_price, 'new_value' => $data['unit_price']],
            ], $data['changed_by'] ?? auth()->id(), $data['change_reason'] ?? null);
        }

        return $item->load('crop');
    }

    public function updateItemPrice(PriceListItem $item, array $data): PriceListItem
    {
        $changes = [];
        if (isset($data['unit_price']) && $item->unit_price != $data['unit_price']) {
            $changes[] = ['field' => 'unit_price', 'old_value' => $item->unit_price, 'new_value' => $data['unit_price']];
        }

        if (isset($data['effective_from']) || isset($data['effective_until'])) {
            $this->validateNoOverlap($item->price_list_id, array_merge($item->toArray(), $data), $item->id);
        }

        $item->update($data);

        if (! empty($changes)) {
            $this->logChange('price_list_item', $item->id, $changes, auth()->id(), $data['change_reason'] ?? null);
        }

        return $item->fresh(['crop']);
    }

    public function removeItemPrice(PriceListItem $item): void
    {
        $item->delete();
    }

    public function bulkSetPrices(PriceList $priceList, array $items, int $userId): array
    {
        $results = [];
        DB::transaction(function () use ($priceList, $items, $userId, &$results) {
            foreach ($items as $itemData) {
                $itemData['changed_by'] = $userId;
                $results[] = $this->setItemPrice($priceList, $itemData);
            }
        });

        return $results;
    }

    // ── Price Resolution ──

    public function resolvePrice(int $customerId, int $cropId, string $itemType, $date = null): ?float
    {
        $customer = Customer::find($customerId);
        if (! $customer) {
            return null;
        }

        $date = $date ?? now();

        // 1. Customer's assigned price list
        if ($customer->price_list_id) {
            $price = $this->findPriceInList($customer->price_list_id, $cropId, $itemType, $date);
            if ($price !== null) {
                return $this->applyRounding($customer->price_list_id, $price);
            }
        }

        // 2. Default price list for customer type
        $defaultList = PriceList::active()
            ->where('is_default', true)
            ->where('type', $customer->type === 'internal' ? 'retail' : 'wholesale')
            ->first();

        if ($defaultList) {
            $price = $this->findPriceInList($defaultList->id, $cropId, $itemType, $date);
            if ($price !== null) {
                return $this->applyRounding($defaultList->id, $price);
            }
        }

        // 3. Fallback: crop_pricing
        return $this->fallbackToCropPricing($cropId, $itemType, $customer->type);
    }

    public function resolvePricesForOrder(int $customerId, array $items): array
    {
        $results = [];
        foreach ($items as $item) {
            $results[] = [
                'crop_id' => $item['crop_id'],
                'item_type' => $item['item_type'],
                'unit_price' => $this->resolvePrice($customerId, $item['crop_id'], $item['item_type']),
            ];
        }

        return $results;
    }

    // ── Profit Simulator ──

    public function simulateMarginImpact(int $cropId, string $itemType, float $newPrice): array
    {
        $cropPricing = CropPricing::where('crop_id', $cropId)->first();
        if (! $cropPricing) {
            return ['error' => 'لا يوجد تسعير للمحصول'];
        }

        $costPerKg = (float) $cropPricing->total_cost_per_kg_roasted;
        $multiplier = match ($itemType) {
            'finished_250' => 0.25,
            'finished_500' => 0.5,
            'finished_1kg' => 1.0,
            default => 1.0,
        };
        $costPerUnit = $costPerKg * $multiplier;

        $currentPrice = match ($itemType) {
            'finished_250' => (float) $cropPricing->retail_price_250g,
            'finished_500' => (float) $cropPricing->retail_price_500g,
            'finished_1kg' => (float) $cropPricing->retail_price_1kg,
            default => (float) $cropPricing->retail_price_1kg,
        };

        $currentMargin = $currentPrice > 0
            ? round((($currentPrice - $costPerUnit) / $currentPrice) * 100, 2)
            : 0;

        $newMargin = $newPrice > 0
            ? round((($newPrice - $costPerUnit) / $newPrice) * 100, 2)
            : 0;

        return [
            'crop_id' => $cropId,
            'item_type' => $itemType,
            'cost_per_unit' => round($costPerUnit, 2),
            'current_price' => $currentPrice,
            'new_price' => $newPrice,
            'current_margin_percent' => $currentMargin,
            'new_margin_percent' => $newMargin,
            'margin_change' => round($newMargin - $currentMargin, 2),
            'profit_per_unit_current' => round($currentPrice - $costPerUnit, 2),
            'profit_per_unit_new' => round($newPrice - $costPerUnit, 2),
            'is_profitable' => $newPrice > $costPerUnit,
        ];
    }

    // ── Price Change Log ──

    public function logChange(string $entityType, int $entityId, array $changes, int $userId, ?string $reason = null): PriceChangeLog
    {
        return PriceChangeLog::create([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'changes' => $changes,
            'change_reason' => $reason,
            'changed_by' => $userId,
            'created_at' => now(),
        ]);
    }

    public function listChangeLogs(): LengthAwarePaginator
    {
        return QueryBuilder::for(PriceChangeLog::class)
            ->allowedFilters([
                AllowedFilter::exact('entity_type'),
                AllowedFilter::exact('entity_id'),
                AllowedFilter::exact('changed_by'),
            ])
            ->allowedSorts(['created_at'])
            ->allowedIncludes(['changedBy'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 25));
    }

    // ── Private Helpers ──

    private function findPriceInList(int $priceListId, int $cropId, string $itemType, $date): ?float
    {
        $item = PriceListItem::where('price_list_id', $priceListId)
            ->where('crop_id', $cropId)
            ->where('item_type', $itemType)
            ->effectiveOn($date)
            ->orderByDesc('effective_from')
            ->first();

        return $item?->unit_price ? (float) $item->unit_price : null;
    }

    private function applyRounding(int $priceListId, float $price): float
    {
        $priceList = PriceList::find($priceListId);

        return $priceList?->rounding_rule
            ? $priceList->rounding_rule->apply($price)
            : round($price, 2);
    }

    private function fallbackToCropPricing(int $cropId, string $itemType, string $customerType): ?float
    {
        $pricing = CropPricing::where('crop_id', $cropId)
            ->where('status', 'approved')
            ->first();

        if (! $pricing) {
            return null;
        }

        if ($customerType === 'external') {
            return match ($itemType) {
                'finished_250' => (float) $pricing->wholesale_price_kg * 0.25,
                'finished_500' => (float) $pricing->wholesale_price_kg * 0.5,
                'finished_1kg' => (float) $pricing->wholesale_price_kg,
                default => (float) $pricing->wholesale_price_kg,
            };
        }

        return match ($itemType) {
            'finished_250' => (float) $pricing->retail_price_250g,
            'finished_500' => (float) $pricing->retail_price_500g,
            'finished_1kg' => (float) $pricing->retail_price_1kg,
            default => (float) $pricing->retail_price_1kg,
        };
    }

    private function validateNoOverlap(int $priceListId, array $data, ?int $excludeId = null): void
    {
        $effectiveFrom = $data['effective_from'] ?? null;
        $effectiveUntil = $data['effective_until'] ?? null;

        // If both are null, no overlap check needed (it's an "always active" price)
        if ($effectiveFrom === null && $effectiveUntil === null) {
            return;
        }

        $query = PriceListItem::where('price_list_id', $priceListId)
            ->where('crop_id', $data['crop_id'])
            ->where('item_type', $data['item_type'])
            ->where('is_active', true);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        // Check for date overlap
        $overlapping = $query->where(function ($q) use ($effectiveFrom, $effectiveUntil) {
            // Existing period overlaps with new period
            $q->where(function ($inner) use ($effectiveFrom, $effectiveUntil) {
                if ($effectiveFrom) {
                    $inner->where(function ($x) use ($effectiveFrom) {
                        $x->whereNull('effective_until')
                            ->orWhere('effective_until', '>', $effectiveFrom);
                    });
                }
                if ($effectiveUntil) {
                    $inner->where(function ($x) use ($effectiveUntil) {
                        $x->whereNull('effective_from')
                            ->orWhere('effective_from', '<', $effectiveUntil);
                    });
                }
            });
        })->exists();

        if ($overlapping) {
            throw ValidationException::withMessages([
                'effective_from' => ['يوجد تداخل في فترة السعر مع سعر موجود لنفس المنتج'],
            ]);
        }
    }

    private function clearDefaultForType(string $type): void
    {
        PriceList::where('type', $type)
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }
}
