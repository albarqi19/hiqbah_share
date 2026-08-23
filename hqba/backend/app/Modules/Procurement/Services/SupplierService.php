<?php

namespace App\Modules\Procurement\Services;

use App\Modules\Procurement\Models\Supplier;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class SupplierService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Supplier::class)
            ->allowedFilters([
                'name',
                'country',
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'country', 'created_at'])
            ->defaultSort('name')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier->fresh();
    }

    public function delete(Supplier $supplier): void
    {
        $supplier->delete();
    }
}
