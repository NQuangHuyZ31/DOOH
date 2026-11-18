import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';
import { GuestGuard } from '../components/GuestGuard';
import { NotFoundPage } from '../components/NotFoundPage';
import { MainLayout } from '../layouts/MainLayout';
import { useAuthInit } from '../hooks/useAuthInit';
import { getDefaultRoutePath, useRegisteredRoutes } from './registry';

const ADMIN_PREFIX = '/admin';

export const AppRouter: React.FC = () => {
	useAuthInit();
	const routes = useRegisteredRoutes();

	const routableEntries = routes.filter((r) => Boolean(r.element || r.component));
	const defaultPath = getDefaultRoutePath();

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to={defaultPath} replace />} />
				<Route path={ADMIN_PREFIX} element={<Navigate to={defaultPath} replace />} />

				{routableEntries.map((route) => {
					const pageNode = route.element ?? (route.component ? React.createElement(route.component) : null);

					const isGuest = route.layout === 'guest' || route.layout === 'bare';
					const content = isGuest ? (
						<GuestGuard>{pageNode}</GuestGuard>
					) : (
						<AuthGuard>
							<MainLayout>{pageNode}</MainLayout>
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
