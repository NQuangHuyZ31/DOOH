import React from 'react';
import type { AppRoute } from '../routes/types';
import { usePermission } from '../hooks/usePermission';
import { AccessDeniedPage } from './AccessDeniedPage';

export interface PermissionGuardProps {
	route: AppRoute;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ route, children, fallback }) => {
	const { canAccessRoute } = usePermission();

	if (!canAccessRoute(route)) {
		return <>{fallback ?? <AccessDeniedPage />}</>;
	}

	return <>{children}</>;
};

export default PermissionGuard;
