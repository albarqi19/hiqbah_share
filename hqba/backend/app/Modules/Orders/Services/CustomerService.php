<?php

namespace App\Modules\Orders\Services;

use App\Core\Models\Branch;
use App\Modules\Orders\Models\Customer;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CustomerService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Customer::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('is_active'),
                'name', 'city',
            ])
            ->allowedSorts(['name', 'created_at', 'type'])
            ->defaultSort('name')
            ->paginate(request('per_page', 25));
    }

    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);
        return $customer->fresh();
    }

    public function delete(Customer $customer): void
    {
        $customer->delete();
    }

    /**
     * Auto-register all branches as internal customers.
     */
    public function syncBranchCustomers(): void
    {
        $branches = Branch::where('type', 'branch')->get();
        foreach ($branches as $branch) {
            Customer::firstOrCreate(
                ['branch_id' => $branch->id, 'type' => 'internal'],
                [
                    'name' => $branch->name,
                    'name_ar' => $branch->name_ar,
                    'city' => $branch->city,
                    'phone' => $branch->phone,
                    'is_active' => $branch->is_active,
                ]
            );
        }
    }
}
