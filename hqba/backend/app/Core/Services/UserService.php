<?php

namespace App\Core\Services;

use App\Core\Events\UserCreated;
use App\Core\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UserService
{
    public function list(): LengthAwarePaginator
    {
        return QueryBuilder::for(User::class)
            ->allowedFilters([
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('roles.name', 'role'),
                'name',
                'email',
            ])
            ->allowedSorts(['name', 'created_at', 'last_login_at'])
            ->allowedIncludes(['branch', 'roles'])
            ->with(['roles'])
            ->defaultSort('name')
            ->paginate(request('per_page', 15));
    }

    public function create(array $data): User
    {
        $roles = $data['roles'] ?? [];
        unset($data['roles']);

        $plainPin = !empty($data['pin']) ? $data['pin'] : $this->generatePin();
        $data['pin'] = Hash::make($plainPin);

        $plainPassword = null;
        if (empty($data['password'])) {
            $plainPassword = $this->generatePassword();
            $data['password'] = $plainPassword;
        }

        $user = User::create($data);

        if (!empty($roles)) {
            $user->syncRoles($roles);
        }

        $user->load(['branch', 'roles']);

        UserCreated::dispatch($user, $plainPin, $plainPassword);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $roles = $data['roles'] ?? null;
        unset($data['roles']);

        if (!empty($data['pin'])) {
            $data['pin'] = Hash::make($data['pin']);
        } else {
            unset($data['pin']);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        if ($roles !== null) {
            $user->syncRoles($roles);
        }

        return $user->fresh(['branch', 'roles']);
    }

    public function delete(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }

    public function toggleActive(User $user): User
    {
        $user->update(['is_active' => !$user->is_active]);

        if (!$user->is_active) {
            $user->tokens()->delete();
        }

        return $user->fresh();
    }

    protected function generatePin(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    protected function generatePassword(): string
    {
        return Str::password(10, true, true, false);
    }
}
