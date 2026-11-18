import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { getLoginRoutePath } from '../routes/registry';
import { useAppSelector } from '../store/hooks';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const { token, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized && token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Authenticating session..." />
      </div>
    );
  }

  if (!token || !isAuthenticated) {
    return <Navigate to={getLoginRoutePath()} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
