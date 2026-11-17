import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Result, Button } from 'antd';
import { MainLayout, doohTheme } from './index';
import { registerRoutes, getRegisteredRoutes } from './routes/registry';
import { moduleRoutes } from './routes/moduleRoutes';
import { ROUTING_CONFIG } from './configs/routing';

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

const App: React.FC = () => {
	const routes = getRegisteredRoutes();

	return (
		<ConfigProvider theme={doohTheme}>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Navigate to={ROUTING_CONFIG.defaultPath} replace />} />
					<Route path={ROUTING_CONFIG.adminPrefix} element={<Navigate to={ROUTING_CONFIG.defaultPath} replace />} />

					{routes.map((route) => {
						const content =
							route.layout === 'guest' ? (
								route.element
							) : (
								<MainLayout>{route.element}</MainLayout>
							);
						return <Route key={route.path} path={route.path} element={content} />;
					})}

					<Route
						path="*"
						element={
							<MainLayout>
								<NotFoundPage />
							</MainLayout>
						}
					/>
				</Routes>
			</BrowserRouter>
		</ConfigProvider>
	);
};

const container = document.getElementById('app');
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
