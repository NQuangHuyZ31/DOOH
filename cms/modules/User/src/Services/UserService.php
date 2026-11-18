<?php

namespace Modules\User\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    /**
     * @param array<string, mixed> $filters
     */
    public function listUsers(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage, $filters);
    }

    public function getUser(int $id): ?User
    {
        /** @var User|null */
        return $this->userRepository->find($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createUser(array $data): User
    {
        $permissionType = $data['permission_type'] ?? User::PERMISSION_TYPE_ROLE;
        $roleId = $data['role_id'] ?? null;
        $directPermissions = $data['direct_permissions'] ?? [];

        /** @var User $user */
        $user = $this->userRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'permission_type' => $permissionType,
            'role_id' => $permissionType === User::PERMISSION_TYPE_ROLE ? $roleId : null,
        ]);

        if ($permissionType === User::PERMISSION_TYPE_DIRECT) {
            $this->userRepository->syncDirectPermissions($user, $directPermissions);
        } elseif ($roleId !== null) {
            $this->userRepository->assignRole($user, (int) $roleId);
        }

        /** @var User */
        return $this->userRepository->find($user->id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateUser(int $id, array $data): ?User
    {
        /** @var User|null $user */
        $user = $this->userRepository->find($id);
        if (!$user) {
            return null;
        }

        $updatePayload = [];
        if (isset($data['name'])) {
            $updatePayload['name'] = $data['name'];
        }
        if (isset($data['email'])) {
            $updatePayload['email'] = $data['email'];
        }
        if (!empty($data['password'])) {
            $updatePayload['password'] = $data['password'];
        }

        if ($updatePayload !== []) {
            $this->userRepository->update($id, $updatePayload);
        }

        $permissionType = $data['permission_type'] ?? $user->permission_type;
        if ($permissionType === User::PERMISSION_TYPE_DIRECT) {
            $this->userRepository->syncDirectPermissions($user, $data['direct_permissions'] ?? []);
        } elseif (!empty($data['role_id'])) {
            $this->userRepository->assignRole($user, (int) $data['role_id']);
        }

        /** @var User|null */
        return $this->userRepository->find($id);
    }

    public function deleteUser(int $id): bool
    {
        return $this->userRepository->delete($id);
    }
}
