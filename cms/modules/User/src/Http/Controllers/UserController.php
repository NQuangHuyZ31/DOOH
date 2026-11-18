<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;
use Modules\User\Resources\UserResource;
use Modules\User\Services\UserService;

class UserController extends BaseController
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', $this->getDefaultPerPage(10));
        $filters = $request->only(['search', 'role', 'permission_type']);

        $paginated = $this->userService->listUsers($filters, $perPage);

        return $this->respondPaginated(
            UserResource::collection($paginated),
            'Users retrieved successfully.'
        );
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        if (!$user) {
            return $this->respondNotFound('User not found.');
        }

        return $this->respondSuccess(new UserResource($user));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->validated());

        return $this->respondCreated(new UserResource($user), 'User created successfully.');
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->updateUser($id, $request->validated());
        if (!$user) {
            return $this->respondNotFound('User not found.');
        }

        return $this->respondSuccess(new UserResource($user), 'User updated successfully.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->userService->deleteUser($id);
        if (!$deleted) {
            return $this->respondNotFound('User not found.');
        }

        return $this->respondSuccess(null, 'User deleted successfully.');
    }
}
