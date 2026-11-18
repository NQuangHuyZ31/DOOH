import React from 'react';
import { Navigate } from 'react-router-dom';
import { getDefaultRoutePath } from '../routes/registry';
import { useAppSelector } from '../store/hooks';

export interface GuestGuardProps {
  children: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  if (token && isAuthenticated) {
    return <Navigate to={getDefaultRoutePath()} replace />;
  }

  return <>{children}</>;
};

export default GuestGuard;
