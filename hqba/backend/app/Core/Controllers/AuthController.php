<?php

namespace App\Core\Controllers;

use App\Core\Requests\LoginRequest;
use App\Core\Requests\PinLoginRequest;
use App\Core\Resources\UserResource;
use App\Core\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends ApiController
{
    public function __construct(
        protected AuthService $authService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->attemptLogin(
            $request->email,
            $request->password,
        );

        if (!$result) {
            return $this->unauthorized(__('auth.failed'));
        }

        return $this->success([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], __('auth.login_success'));
    }

    public function pinLogin(PinLoginRequest $request): JsonResponse
    {
        $result = $this->authService->attemptPinLogin($request->pin);

        if (!$result) {
            return $this->unauthorized(__('auth.failed'));
        }

        return $this->success([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], __('auth.login_success'));
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['branch', 'roles', 'permissions']);

        return $this->success(new UserResource($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->success(message: __('auth.logout_success'));
    }
}
