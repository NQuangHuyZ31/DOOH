import React from 'react';
import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { VenueItem } from '../Action/venueApi';

interface ColumnActions {
	onEdit: (item: VenueItem) => void;
	onDelete: (id: number) => void;
	onPreview: (item: VenueItem) => void;
}

export const getVenueColumns = ({ onEdit, onDelete, onPreview }: ColumnActions) => [
	{
		title: 'Code',
		dataIndex: 'code',
		key: 'code',
		width: 130,
		render: (code: string) => <strong>{code}</strong>,
	},
	{
		title: 'Screen Name',
		dataIndex: 'name',
		key: 'name',
	},
	{
		title: 'Location',
		dataIndex: 'location',
		key: 'location',
	},
	{
		title: 'Resolution',
		key: 'resolution',
		width: 140,
		render: (_: any, record: VenueItem) => `${record.width} x ${record.height}`,
	},
	{
		title: 'Orientation',
		dataIndex: 'orientation',
		key: 'orientation',
		width: 120,
		render: (val: string) => (val === 'portrait' ? 'Portrait (9:16)' : 'Landscape (16:9)'),
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
		width: 160,
		render: (_: any, record: VenueItem) => (
			<Space size="small">
				<Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => onPreview(record)} title="Screen Simulator" />
				<Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete screen?" description="Are you sure you want to delete this venue?" onConfirm={() => onDelete(record.id)} okText="Yes" cancelText="No">
					<Button type="link" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
