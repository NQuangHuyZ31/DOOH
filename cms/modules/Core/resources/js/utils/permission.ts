import type { AuthUser } from '@modules/Auth/resources/js/types/auth';
import type { AppRoute } from '../routes/types';

export const isSuperAdmin = (user?: AuthUser | null): boolean => {
	if (!user) return false;
	if (user.role === 'super_admin') return true;
	if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return true;
	return false;
};

export const hasRole = (user: AuthUser | null | undefined, requiredRoles: string | string[]): boolean => {
	if (!user) return false;
	if (isSuperAdmin(user)) return true;

	const roleList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
	if (user.role && roleList.includes(user.role)) return true;
	if (Array.isArray(user.roles) && user.roles.some((r) => roleList.includes(r))) return true;

	return false;
};

export const hasPermission = (user: AuthUser | null | undefined, requiredPermission: string): boolean => {
	if (!user) return false;
	if (isSuperAdmin(user)) return true;

	const permissions = user.permissions ?? [];
	return permissions.includes(requiredPermission);
};

export const hasRoutePermission = (user: AuthUser | null | undefined, route: AppRoute): boolean => {
	if (!user) return false;
	if (isSuperAdmin(user)) return true;

	if (route.roles && route.roles.length > 0) {
		const roleMatch = hasRole(user, route.roles);
		if (!roleMatch) return false;
	}

	if (route.permission) {
		const perms = Array.isArray(route.permission) ? route.permission : [route.permission];
		const permMatch = perms.some((p) => hasPermission(user, p));
		if (!permMatch) return false;
	}

	if (route.module) {
		const action = route.action || 'view';
		const modulePerm = `${route.module}.${action}`;
		if (!hasPermission(user, modulePerm)) return false;
	}

	return true;
};
