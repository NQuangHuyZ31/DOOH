import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '../configs/routing';
import { useAppSelector } from '../store/hooks';

interface GuestGuardProps {
	children: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
	const { token, isAuthenticated } = useAppSelector((state) => state.auth);

	if (token && isAuthenticated) {
		return <Navigate to={ROUTING_CONFIG.defaultPath} replace />;
	}

	return <>{children}</>;
};

export default GuestGuard;
