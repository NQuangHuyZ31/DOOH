import React from 'react';
import { Space, Button, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { VenueItem } from '../types/venue';

interface ColumnActions {
	onEdit: (item: VenueItem) => void;
	onDelete: (id: number) => void;
}

export const getVenueColumns = ({ onEdit, onDelete }: ColumnActions) => [
	{
		title: 'Code',
		dataIndex: 'code',
		key: 'code',
		width: 140,
		render: (code: string) => <Tag color="blue">{code}</Tag>,
	},
	{
		title: 'Venue Name',
		dataIndex: 'name',
		key: 'name',
		render: (name: string, record: VenueItem) => (
			<div>
				<strong>{name}</strong>
				{record.address && (
					<div style={{ fontSize: 12, color: '#8c8c8c' }}>
						<EnvironmentOutlined style={{ marginRight: 4 }} />
						{record.address}
					</div>
				)}
			</div>
		),
	},
	{
		title: 'Type',
		dataIndex: 'venue_type',
		key: 'venue_type',
		width: 150,
		render: (val: string) => <Tag>{val?.replace(/_/g, ' ') || 'General'}</Tag>,
	},
	{
		title: 'City / Region',
		key: 'region',
		width: 160,
		render: (_: unknown, record: VenueItem) => (record.city_province ? `${record.district ? record.district + ', ' : ''}${record.city_province}` : '—'),
	},
	{
		title: 'Screens',
		key: 'screens',
		width: 90,
		align: 'center' as const,
		render: (_: unknown, record: VenueItem) => <Tag color="geekblue">{record.screens_count ?? 0}</Tag>,
	},
	{
		title: 'Media Owner',
		key: 'media_owner',
		width: 150,
		render: (_: unknown, record: VenueItem) => (record.media_owner?.name ? <Tag color="purple">{record.media_owner.name}</Tag> : <span style={{ color: '#bfbfbf', fontSize: 12 }}>Unassigned</span>),
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
		render: (status: string) => <StatusTag status={status || 'active'} />,
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 110,
		render: (_: unknown, record: VenueItem) => (
			<Space size="small">
				<Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete Venue" description="Delete this venue and its associated screens?" onConfirm={() => onDelete(record.id)} okText="Yes" cancelText="No">
					<Button type="link" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
