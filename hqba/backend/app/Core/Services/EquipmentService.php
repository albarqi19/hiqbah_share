<?php

namespace App\Core\Services;

use App\Core\Models\Equipment;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class EquipmentService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Equipment::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
                'name',
                'code',
            ])
            ->allowedSorts(['name', 'code', 'created_at'])
            ->allowedIncludes(['branch'])
            ->defaultSort('code')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Equipment
    {
        return Equipment::create($data);
    }

    public function update(Equipment $equipment, array $data): Equipment
    {
        $equipment->update($data);

        return $equipment->fresh();
    }

    public function delete(Equipment $equipment): void
    {
        $equipment->delete();
    }
}
