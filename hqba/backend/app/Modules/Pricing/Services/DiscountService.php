<?php

namespace App\Modules\Pricing\Services;

use App\Modules\Orders\Models\Order;
use App\Modules\Pricing\Models\Discount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DiscountService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Discount::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('customer_id'),
                AllowedFilter::partial('name'),
                AllowedFilter::partial('code'),
            ])
            ->allowedSorts(['name', 'created_at', 'value', 'times_used'])
            ->allowedIncludes(['customer', 'priceList', 'createdBy'])
            ->defaultSort('-created_at')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Discount
    {
        return Discount::create($data);
    }

    public function update(Discount $discount, array $data): Discount
    {
        $discount->update($data);

        return $discount->fresh();
    }

    public function deactivate(Discount $discount): Discount
    {
        $discount->update(['is_active' => false]);

        return $discount->fresh();
    }

    public function validateCouponCode(string $code, ?int $customerId = null): Discount
    {
        $discount = Discount::where('code', $code)->first();

        if (! $discount) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم غير صالح'],
            ]);
        }

        if (! $discount->is_active) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم غير نشط'],
            ]);
        }

        $now = now();
        if ($discount->valid_from && $now->lt($discount->valid_from)) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم لم يبدأ بعد'],
            ]);
        }

        if ($discount->valid_until && $now->gt($discount->valid_until)) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم منتهي الصلاحية'],
            ]);
        }

        if ($discount->max_uses !== null && $discount->times_used >= $discount->max_uses) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم استنفد عدد مرات الاستخدام'],
            ]);
        }

        if ($discount->customer_id && $customerId && $discount->customer_id !== $customerId) {
            throw ValidationException::withMessages([
                'code' => ['كود الخصم مخصص لعميل آخر'],
            ]);
        }

        return $discount;
    }

    public function findApplicableDiscounts(Order $order): Collection
    {
        $totalQuantity = $order->items()->sum('quantity');

        return Discount::valid()
            ->where(function ($q) use ($order) {
                $q->whereNull('customer_id')
                    ->orWhere('customer_id', $order->customer_id);
            })
            ->get()
            ->filter(fn (Discount $d) => $d->isApplicable((float) $order->subtotal, $totalQuantity));
    }

    public function applyDiscount(Order $order, Discount $discount): Order
    {
        $totalQuantity = $order->items()->sum('quantity');

        if (! $discount->isApplicable((float) $order->subtotal, $totalQuantity)) {
            throw ValidationException::withMessages([
                'discount' => ['الخصم غير قابل للتطبيق على هذا الطلب'],
            ]);
        }

        $discountAmount = $discount->calculateDiscount((float) $order->subtotal);

        $order->update([
            'discount' => $discountAmount,
            'discount_id' => $discount->id,
            'discount_code' => $discount->code,
        ]);

        $order->calculateTotals();
        $order->save();

        $discount->increment('times_used');

        return $order->fresh();
    }

    public function applyDiscountByCode(Order $order, string $code): Order
    {
        $discount = $this->validateCouponCode($code, $order->customer_id);

        return $this->applyDiscount($order, $discount);
    }
}
