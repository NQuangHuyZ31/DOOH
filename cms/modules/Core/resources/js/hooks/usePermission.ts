import { useCallback, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import type { AppRoute } from '../routes/types';
import { hasPermission as checkPermission, hasRole as checkRole, hasRoutePermission, isSuperAdmin as checkSuperAdmin } from '../utils/permission';

export const usePermission = () => {
	const user = useAppSelector((state) => state.auth.user);

	const isSuperAdmin = useMemo(() => checkSuperAdmin(user), [user]);

	const canAccessRoute = useCallback(
		(route: AppRoute): boolean => {
			return hasRoutePermission(user, route);
		},
		[user],
	);

	const hasPermission = useCallback(
		(permission: string): boolean => {
			return checkPermission(user, permission);
		},
		[user],
	);

	const hasRole = useCallback(
		(role: string | string[]): boolean => {
			return checkRole(user, role);
		},
		[user],
	);

	return {
		user,
		isSuperAdmin,
		canAccessRoute,
		hasPermission,
		hasRole,
	};
};

export default usePermission;
