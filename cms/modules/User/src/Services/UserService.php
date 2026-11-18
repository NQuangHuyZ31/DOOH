<?php

namespace Modules\User\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected RoleRepositoryInterface $roleRepository,
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    public function listUsers(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage, $filters);
    }

    public function getUser(int $id): ?User
    {
        return $this->userRepository->find($id);
    }

    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $permissionType = $data['permission_type'] ?? User::PERMISSION_TYPE_ROLE;

            if ($permissionType === User::PERMISSION_TYPE_DIRECT) {
                $roleId = null;
                $permissionIds = $this->resolvePermissionIds($data['direct_permissions'] ?? []);
            } else {
                $roleId = $this->resolveRoleId($data['role_id'] ?? null);
                $permissionIds = [];
            }

            $user = $this->userRepository->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'permission_type' => $permissionType,
                'role_id' => $roleId,
            ]);

            $this->userRepository->syncDirectPermissions($user, $permissionIds);

            /** @var User */
            return $this->userRepository->find($user->id);
        });
    }

    public function updateUser(int $id, array $data): ?User
    {
        return DB::transaction(function () use ($id, $data) {
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

            $permissionType = $data['permission_type'] ?? $user->permission_type;
            $updatePayload['permission_type'] = $permissionType;

            if ($permissionType === User::PERMISSION_TYPE_DIRECT) {
                $updatePayload['role_id'] = null;
                $permissionIds = $this->resolvePermissionIds($data['direct_permissions'] ?? []);
            } else {
                if (array_key_exists('role_id', $data)) {
                    $updatePayload['role_id'] = $this->resolveRoleId($data['role_id']);
                }
                $permissionIds = [];
            }

            $this->userRepository->update($id, $updatePayload);
            $this->userRepository->syncDirectPermissions($user, $permissionIds);

            return $this->userRepository->find($id);
        });
    }

    public function deleteUser(int $id): bool
    {
        return $this->userRepository->delete($id);
    }

    protected function resolveRoleId(int|string|null $role): ?int
    {
        if ($role === null) {
            return null;
        }

        if (is_numeric($role)) {
            return (int) $role;
        }

        $roleModel = $this->roleRepository->findByName($role);

        return $roleModel?->id;
    }

    protected function resolvePermissionIds(array $permissionIdsOrNames): array
    {
        if (empty($permissionIdsOrNames)) {
            return [];
        }

        $ids = [];
        $names = [];

        foreach ($permissionIdsOrNames as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } else {
                $names[] = (string) $item;
            }
        }

        if (!empty($names)) {
            $resolvedIds = $this->permissionRepository->getIdsByNames($names);
            $ids = array_merge($ids, $resolvedIds);
        }

        return array_values(array_unique($ids));
    }
}
