import React from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Badge, Button, Popconfirm, Popover, Space, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons';
import { UREKA_COLORS } from '@core/configs/theme';
import type { RoleItem } from '../types/role';

const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
	super_admin: 'red',
	admin: 'blue',
	operator: 'green',
	viewer: 'orange',
};

export const getRoleColumns = (onEdit: (role: RoleItem) => void, onDelete: (id: number) => void): ColumnsType<RoleItem> => [
	{
		title: 'Role Name',
		key: 'name',
		render: (_: unknown, record: RoleItem) => {
			const color = ROLE_COLORS[record.name] || 'cyan';
			return (
				<Space direction="vertical" size={2}>
					<Space>
						<Text strong>{record.display_name}</Text>
						<Tag color={color}>{record.name}</Tag>
					</Space>
					{record.description && (
						<Text type="secondary" style={{ fontSize: 12 }}>
							{record.description}
						</Text>
					)}
				</Space>
			);
		},
	},
	{
		title: 'Users',
		dataIndex: 'users_count',
		key: 'users_count',
		width: 110,
		align: 'center',
		render: (count?: number) => <Badge count={count ?? 0} showZero style={{ backgroundColor: (count ?? 0) > 0 ? UREKA_COLORS.info : '#d9d9d9' }} />,
	},
	{
		title: 'Permissions',
		key: 'permissions',
		render: (_: unknown, record: RoleItem) => {
			if (record.name === 'super_admin') {
				return <Tag color="gold">All Permissions (Bypassed)</Tag>;
			}

			const perms = record.permissions || [];
			if (perms.length === 0) {
				return <Text type="secondary">No permissions assigned</Text>;
			}

			const content = (
				<div style={{ maxWidth: 360, maxHeight: 240, overflowY: 'auto' }}>
					<Space direction="vertical" size={4}>
						{perms.map((p) => (
							<Tag key={p.id} color="blue">
								{p.display_name} ({p.name})
							</Tag>
						))}
					</Space>
				</div>
			);

			return (
				<Popover content={content} title="Assigned Permissions" trigger="hover">
					<Tag icon={<KeyOutlined />} color="geekblue" style={{ cursor: 'pointer' }}>
						{perms.length} Permissions
					</Tag>
				</Popover>
			);
		},
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 120,
		align: 'center',
		render: (_: unknown, record: RoleItem) => {
			const isSuperAdmin = record.name === 'super_admin';

			return (
				<Space size="small">
					<Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
					<Tooltip title={isSuperAdmin ? 'Super Admin cannot be deleted' : undefined}>
						<span>
							<Popconfirm
								title="Delete role"
								description={`Are you sure you want to delete role "${record.display_name}"?`}
								onConfirm={() => onDelete(record.id)}
								okText="Yes"
								cancelText="No"
								okButtonProps={{ danger: true }}
								disabled={isSuperAdmin}
							>
								<Button type="text" danger icon={<DeleteOutlined />} size="small" disabled={isSuperAdmin} />
							</Popconfirm>
						</span>
					</Tooltip>
				</Space>
			);
		},
	},
];
