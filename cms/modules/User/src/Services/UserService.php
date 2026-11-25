<?php

namespace Modules\User\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Modules\User\Events\UserDeleted;
use Modules\User\Events\UserSaved;
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
			$access = $this->resolveAccessState($data);

			$user = $this->userRepository->create(array_merge(
				Arr::only($data, ['name', 'email', 'password']),
				$access['payload']
			));

			$this->userRepository->syncDirectPermissions($user, $access['permission_ids']);
			event(new UserSaved($user, $data, true));

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

			$access = $this->resolveAccessState($data, $user);
			$updatePayload = array_merge(Arr::only($data, ['name', 'email']), $access['payload']);
			if (!empty($data['password'])) {
				$updatePayload['password'] = $data['password'];
			}

			$this->userRepository->update($id, $updatePayload);

			if ($access['sync_permissions']) {
				$this->userRepository->syncDirectPermissions($user, $access['permission_ids']);
			}

			event(new UserSaved($user, $data, false));

			return $this->userRepository->find($id);
		});
	}

	public function deleteUser(int $id): bool
	{
		return DB::transaction(function () use ($id) {
			$deleted = $this->userRepository->delete($id);
			if ($deleted) {
				event(new UserDeleted($id));
			}

			return $deleted;
		});
	}

	public function sendResetPasswordLink(int $id, ?int $actingUserId = null): array
	{
		$user = $this->userRepository->find($id);
		if (!$user) {
			return ['success' => false, 'code' => 404, 'message' => 'User not found.'];
		}

		if ($user->hasRole(['super_admin', 'admin'])) {
			return ['success' => false, 'code' => 400, 'message' => 'Cannot reset password for Admin or Super Admin accounts.'];
		}

		$currentUserId = $actingUserId ?? auth('sanctum')->id() ?? auth()->id();
		if ($currentUserId && (int) $user->id === (int) $currentUserId) {
			return ['success' => false, 'code' => 400, 'message' => 'You cannot reset password for your own account.'];
		}

		$token = Password::broker('users')->createToken($user);
		$resetUrl = url('/admin/login?reset-password=1&token=' . $token . '&email=' . urlencode($user->email));
		$ttl = (int) config('auth.passwords.users.expire', 60);

		SendResetPasswordMailJob::dispatch($user->name, $user->email, $resetUrl, $ttl);

		return ['success' => true, 'code' => 200, 'message' => 'Password reset email sent successfully.'];
	}

	protected function resolveAccessState(array $data, ?User $existing = null): array
	{
		$permissionType = $data['permission_type'] ?? $existing?->permission_type ?? User::PERMISSION_TYPE_ROLE;
		$permissionTypeChanged = $existing !== null && isset($data['permission_type']) && $data['permission_type'] !== $existing->permission_type;

		$payload = ['permission_type' => $permissionType];
		$syncPermissions = $existing === null;
		$permissionIds = [];

		if ($permissionType === User::PERMISSION_TYPE_DIRECT) {
			$payload['role_id'] = null;
			if ($existing === null || array_key_exists('direct_permissions', $data) || $permissionTypeChanged) {
				$syncPermissions = true;
				$permissionIds = $this->resolvePermissionIds($data['direct_permissions'] ?? []);
			}
		} else {
			if ($existing === null || array_key_exists('role_id', $data)) {
				$payload['role_id'] = $this->resolveRoleId($data['role_id'] ?? null);
			}
			if ($permissionTypeChanged) {
				$syncPermissions = true;
			}
		}

		return [
			'payload' => $payload,
			'sync_permissions' => $syncPermissions,
			'permission_ids' => $permissionIds,
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

		return $this->roleRepository->findByName($role)?->id;
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
			$ids = array_merge($ids, $this->permissionRepository->getIdsByNames($names));
		}

		return array_values(array_unique($ids));
	}
}
