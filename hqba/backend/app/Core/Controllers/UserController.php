<?php

namespace App\Core\Controllers;

use App\Core\Models\User;
use App\Core\Requests\StoreUserRequest;
use App\Core\Requests\UpdateUserRequest;
use App\Core\Resources\UserResource;
use App\Core\Services\UserService;
use Illuminate\Http\JsonResponse;

class UserController extends ApiController
{
    public function __construct(
        protected UserService $userService,
    ) {}

    public function index(): JsonResponse
    {
        $users = $this->userService->list();

        return $this->success(UserResource::collection($users));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return $this->created(new UserResource($user));
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['branch', 'roles']);

        return $this->success(new UserResource($user));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated());

        return $this->success(new UserResource($user));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->userService->delete($user);

        return $this->noContent();
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user = $this->userService->toggleActive($user);

        return $this->success(new UserResource($user));
    }
}
