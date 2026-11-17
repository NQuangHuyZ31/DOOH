import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
import { GuestGuard } from '../components/GuestGuard';
import { NotFoundPage } from '../components/NotFoundPage';
import { MainLayout } from '../layouts/MainLayout';
import { ROUTING_CONFIG } from '../configs/routing';
import { useAuthInit } from '../hooks/useAuthInit';
import { useRegisteredRoutes } from './registry';
import './autoRegister';

export const AppRouter: React.FC = () => {
	useAuthInit();
	const routes = useRegisteredRoutes();

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to={ROUTING_CONFIG.defaultPath} replace />} />
				<Route path={ROUTING_CONFIG.adminPrefix} element={<Navigate to={ROUTING_CONFIG.defaultPath} replace />} />

				{routes.map((route) => {
					const content =
						route.layout === 'guest' ? (
							<GuestGuard>{route.element}</GuestGuard>
						) : (
							<AuthGuard>
								<MainLayout>{route.element}</MainLayout>
							</AuthGuard>
						);
					return <Route key={route.path} path={route.path} element={content} />;
				})}

				<Route
					path="*"
					element={
						<AuthGuard>
							<MainLayout>
								<NotFoundPage />
							</MainLayout>
						</AuthGuard>
					}
				/>
			</Routes>
		</BrowserRouter>
	);
};

export default AppRouter;
