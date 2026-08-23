<?php

namespace App\Core\Services;

use App\Core\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function attemptLogin(string $email, string $password): ?array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        if (!$user->is_active) {
            return null;
        }

        return $this->authenticateUser($user, 'email');
    }

    public function attemptPinLogin(string $pin): ?array
    {
        $users = User::where('is_active', true)->get();

        $user = $users->first(function ($user) use ($pin) {
            return Hash::check($pin, $user->pin);
        });

        if (!$user) {
            return null;
        }

        return $this->authenticateUser($user, 'pin');
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    protected function authenticateUser(User $user, string $loginMethod): array
    {
        $user->update(['last_login_at' => now()]);

        $tokenName = $loginMethod === 'pin' ? 'station-token' : 'admin-token';
        $token = $user->createToken($tokenName)->plainTextToken;

        $user->load(['branch', 'roles.permissions', 'permissions']);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
