import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getDefaultRoutePath } from '../routes/registry';

export interface AccessDeniedPageProps {
	title?: string;
	subTitle?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ title = '403', subTitle = 'Access Denied: You do not have permission to access this page.' }) => {
	const navigate = useNavigate();

	return (
		<Result
			status="403"
			title={title}
			subTitle={subTitle}
			extra={
				<Button type="primary" onClick={() => navigate(getDefaultRoutePath())}>
					Back to Dashboard
				</Button>
			}
		/>
	);
};

export default AccessDeniedPage;
