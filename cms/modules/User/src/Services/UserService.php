<?php

namespace Modules\User\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Modules\User\Jobs\SendResetPasswordMailJob;
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

    public function getMediaOwners(): array
    {
        return $this->userRepository->getUsersByRoles(['media_owner', 'admin']);
    }

    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $permissionType = $data['permission_type'] ?? $this->userRepository->getModel()::PERMISSION_TYPE_ROLE;

            if ($permissionType === $this->userRepository->getModel()::PERMISSION_TYPE_DIRECT) {
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

            $permissionTypeChanged = isset($data['permission_type']) && $data['permission_type'] !== $user->permission_type;
            $permissionType = $data['permission_type'] ?? $user->permission_type;
            $updatePayload['permission_type'] = $permissionType;

            $shouldSyncDirectPermissions = false;
            $permissionIds = [];

            if ($permissionType === $this->userRepository->getModel()::PERMISSION_TYPE_DIRECT) {
                $updatePayload['role_id'] = null;
                if (array_key_exists('direct_permissions', $data) || $permissionTypeChanged) {
                    $shouldSyncDirectPermissions = true;
                    $permissionIds = $this->resolvePermissionIds($data['direct_permissions'] ?? []);
                }
            } else {
                if (array_key_exists('role_id', $data)) {
                    $updatePayload['role_id'] = $this->resolveRoleId($data['role_id']);
                }
                if ($permissionTypeChanged) {
                    $shouldSyncDirectPermissions = true;
                    $permissionIds = [];
                }
            }

            $this->userRepository->update($id, $updatePayload);

            if ($shouldSyncDirectPermissions) {
                $this->userRepository->syncDirectPermissions($user, $permissionIds);
            }

            return $this->userRepository->find($id);
        });
    }

    public function deleteUser(int $id): bool
    {
        return $this->userRepository->delete($id);
    }

    /**
     * @return array{success: bool, message: string}
     */
    public function sendResetPasswordLink(int $id): array
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found.',
            ];
        }

        if ($user->hasRole(['super_admin', 'admin'])) {
            return [
                'success' => false,
                'message' => 'Cannot reset password for Admin or Super Admin accounts.',
            ];
        }

        $currentUserId = auth('sanctum')->id() ?? auth()->id();
        if ($currentUserId && (int) $user->id === (int) $currentUserId) {
            return [
                'success' => false,
                'message' => 'You cannot reset password for your own account.',
            ];
        }

        $token = Password::broker('users')->createToken($user);
        $resetUrl = url('/admin/login?reset-password=1&token=' . $token . '&email=' . urlencode($user->email));

        SendResetPasswordMailJob::dispatch($user->name, $user->email, $resetUrl, 60);

        return [
            'success' => true,
            'message' => 'Password reset email sent successfully.',
        ];
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
