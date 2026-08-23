<?php

namespace App\Core\Services;

use App\Core\Models\Branch;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BranchService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(Branch::class)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('is_active'),
                'name',
                'city',
            ])
            ->allowedSorts(['name', 'created_at', 'city'])
            ->allowedIncludes(['users', 'equipment'])
            ->withCount(['users', 'equipment'])
            ->defaultSort('name')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): Branch
    {
        return Branch::create($data);
    }

    public function update(Branch $branch, array $data): Branch
    {
        $branch->update($data);

        return $branch->fresh();
    }

    public function delete(Branch $branch): void
    {
        $branch->delete();
    }
}
