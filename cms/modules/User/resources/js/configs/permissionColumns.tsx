import React from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Badge, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import type { MetadataOption } from '@core/types/metadata';
import type { PermissionItem } from '../types/permission';

const { Text } = Typography;

export const getPermissionColumns = (onEdit: (permission: PermissionItem) => void, onDelete: (id: number) => void, moduleOptions?: MetadataOption[]): ColumnsType<PermissionItem> => {
	const colorMap = (moduleOptions || []).reduce<Record<string, string>>((acc, item) => {
		if (item.color) {
			acc[item.value.toLowerCase()] = item.color;
		}
		return acc;
	}, {});

	return [
		{
			title: 'Module',
			dataIndex: 'module',
			key: 'module',
			width: 130,
			render: (module: string) => {
				const color = colorMap[module?.toLowerCase()] || 'default';
				return <Tag color={color}>{(module || 'GENERAL').toUpperCase()}</Tag>;
			},
		},
		{
			title: 'Permission Name (Slug)',
			key: 'name',
			render: (_: unknown, record: PermissionItem) => (
				<Space direction="vertical" size={2}>
					<Space>
						<KeyOutlined style={{ color: '#1890ff' }} />
						<Text code strong>
							{record.name}
						</Text>
					</Space>
					<Text>{record.display_name}</Text>
				</Space>
			),
		},
		{
			title: 'Description',
			dataIndex: 'description',
			key: 'description',
			render: (desc?: string) => (
				<Text type="secondary" style={{ fontSize: 13 }}>
					{desc || '-'}
				</Text>
			),
		},
		{
			title: 'Assigned Roles',
			dataIndex: 'roles_count',
			key: 'roles_count',
			width: 130,
			align: 'center',
			render: (count?: number) => <Badge count={count ?? 0} showZero style={{ backgroundColor: (count ?? 0) > 0 ? '#52c41a' : '#d9d9d9' }} />,
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 120,
			align: 'center',
			render: (_: unknown, record: PermissionItem) => (
				<Space size="small">
					<Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
					<Popconfirm
						title="Delete permission"
						description={`Are you sure you want to delete permission "${record.name}"?`}
						onConfirm={() => onDelete(record.id)}
						okText="Yes"
						cancelText="No"
						okButtonProps={{ danger: true }}
					>
						<Button type="text" danger icon={<DeleteOutlined />} size="small" />
					</Popconfirm>
				</Space>
			),
		},
	];
};
