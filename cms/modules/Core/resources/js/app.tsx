import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Result, Button } from 'antd';
import { Provider } from 'react-redux';
import {
	MainLayout,
	AuthGuard,
	GuestGuard,
	doohTheme,
	store,
	useAppDispatch,
	ROUTING_CONFIG,
} from './index';
import { registerRoutes, getRegisteredRoutes } from './routes/registry';
import { moduleRoutes } from './routes/moduleRoutes';
import { setInitialized } from '@modules/Auth/resources/js/store/authSlice';
import { fetchMe } from '@modules/Auth/resources/js/store/authThunk';

registerRoutes(moduleRoutes);

const NotFoundPage: React.FC = () => (
	<Result
		status="404"
		title="404"
		subTitle="Sorry, the page you visited does not exist."
		extra={
			<Button type="primary" href={ROUTING_CONFIG.defaultPath}>
				Back to Dashboard
			</Button>
		}
	/>
);

const AppRoutes: React.FC = () => {
	const dispatch = useAppDispatch();
	const routes = getRegisteredRoutes();

	useEffect(() => {
		const token = localStorage.getItem(ROUTING_CONFIG.auth.tokenKey);
		if (token) {
			dispatch(fetchMe());
		} else {
			dispatch(setInitialized(true));
		}
	}, [dispatch]);

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

const App: React.FC = () => (
	<Provider store={store}>
		<ConfigProvider theme={doohTheme}>
			<AppRoutes />
		</ConfigProvider>
	</Provider>
);

const container = document.getElementById('app');
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
