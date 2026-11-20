<?php

namespace Modules\Core\Support;

class UserPermissionHelper
{
	public static function canReview(mixed $user, string $permission = 'creative.approve'): bool
	{
		if (!$user) {
			return false;
		}

		if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
			return true;
		}

		if (method_exists($user, 'hasRole') && $user->hasRole(['super_admin', 'admin', 'operator'])) {
			return true;
		}

		if (method_exists($user, 'hasPermission') && $user->hasPermission($permission)) {
			return true;
		}

		$role = $user->role ?? null;
		$roleName = $user->role_name ?? null;

		return in_array($role, ['super_admin', 'admin', 'operator'], true)
			|| in_array($roleName, ['super_admin', 'admin', 'operator'], true);
	}

	public static function hasAnyRole(mixed $user, array $roles): bool
	{
		if (!$user) {
			return false;
		}

		if (method_exists($user, 'hasRole') && $user->hasRole($roles)) {
			return true;
		}

		$role = $user->role ?? null;
		$roleName = $user->role_name ?? null;

		return in_array($role, $roles, true)
			|| in_array($roleName, $roles, true);
	}
}
