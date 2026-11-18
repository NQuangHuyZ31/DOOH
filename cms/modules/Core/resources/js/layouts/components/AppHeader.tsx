import React from 'react';
import { Layout, Typography, Space, Button, Tag, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { UREKA_COLORS } from '@core/configs/theme';
import { getLoginRoutePath } from '@core/routes/registry';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { logout } from '@modules/Auth/resources/js/store/authThunk';

const { Header } = Layout;
const { Text } = Typography;

export const AppHeader: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);

	const handleLogout = async () => {
		await dispatch(logout());
		navigate(getLoginRoutePath(), { replace: true });
	};

	return (
		<Header
			style={{
				background: '#fff',
				padding: '0 24px',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				flexShrink: 0,
				zIndex: 10,
				boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
			}}
		>
			<Text strong>DOOH Media Management Platform</Text>
			<Space size="middle">
				<Space size="small">
					<Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: UREKA_COLORS.primary }} />
					<Text strong>{user?.name || 'User'}</Text>
					{user?.role && <Tag color="blue">{user.role}</Tag>}
				</Space>
				<Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
					Logout
				</Button>
			</Space>
		</Header>
	);
};

export default AppHeader;
