import React from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Avatar, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { UREKA_COLORS } from '@core/configs/theme';
import type { UserItem } from '../types/user';

const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
	super_admin: 'red',
	admin: 'blue',
	operator: 'green',
	viewer: 'orange',
};

export const getUserColumns = (onEdit: (user: UserItem) => void, onDelete: (id: number) => void): ColumnsType<UserItem> => [
	{
		title: 'User',
		dataIndex: 'name',
		key: 'name',
		render: (_: unknown, record: UserItem) => (
			<Space direction="horizontal" size="middle">
				<Avatar icon={<UserOutlined />} style={{ backgroundColor: UREKA_COLORS.primary }} />
				<Space direction="vertical" size={0}>
					<Text strong>{record.name}</Text>
					<Text type="secondary" style={{ fontSize: 12 }}>
						{record.email}
					</Text>
				</Space>
			</Space>
		),
	},
	{
		title: 'Role',
		key: 'role',
		render: (_: unknown, record: UserItem) => {
			const roleName = typeof record.role === 'object' && record.role !== null ? record.role.name : typeof record.role === 'string' ? record.role : (record.roles?.[0] ?? 'none');

			const displayName = typeof record.role === 'object' && record.role !== null ? record.role.display_name || record.role.name : roleName;

			return <Tag color={ROLE_COLORS[roleName] || 'default'}>{displayName.toUpperCase()}</Tag>;
		},
	},
	{
		title: 'Permission Type',
		dataIndex: 'permission_type',
		key: 'permission_type',
		render: (type?: string) => <Tag color={type === 'direct' ? 'cyan' : 'purple'}>{type === 'direct' ? 'Direct Permissions' : 'Role-based'}</Tag>,
	},
	{
		title: 'Created At',
		dataIndex: 'created_at',
		key: 'created_at',
		render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '-'),
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 140,
		align: 'center',
		render: (_: unknown, record: UserItem) => (
			<Space size="small">
				<Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
				<Popconfirm title="Delete user" description={`Are you sure you want to delete ${record.name}?`} onConfirm={() => onDelete(record.id)} okText="Yes" cancelText="No" okButtonProps={{ danger: true }}>
					<Button type="text" danger icon={<DeleteOutlined />} size="small" />
				</Popconfirm>
			</Space>
		),
	},
];
