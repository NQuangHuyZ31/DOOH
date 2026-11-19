import React from 'react';
import { Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, KeyOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { ScreenItem } from '../types/venue';

interface ScreenColumnActions {
	onEdit: (item: ScreenItem) => void;
	onDelete: (id: number) => void;
	onPreview: (item: ScreenItem) => void;
	onShowCredentials: (item: ScreenItem) => void;
}

export const getScreenColumns = ({ onEdit, onDelete, onPreview, onShowCredentials }: ScreenColumnActions) => [
	{
		title: 'Screen Code',
		dataIndex: 'code',
		key: 'code',
		width: 170,
		render: (code: string) => <Tag color="purple">{code}</Tag>,
	},
	{
		title: 'Screen / Venue',
		key: 'name_venue',
		render: (_: unknown, record: ScreenItem) => (
			<div>
				<strong>{record.name}</strong>
				{record.venue && (
					<div style={{ fontSize: 12, color: '#8c8c8c' }}>
						Venue: {record.venue.name} ({record.venue.code})
					</div>
				)}
				{record.sub_location && <div style={{ fontSize: 11, color: '#bfbfbf' }}>Spot: {record.sub_location}</div>}
			</div>
		),
	},
	{
		title: 'Display Specs',
		key: 'specs',
		width: 160,
		render: (_: unknown, record: ScreenItem) => (
			<div>
				<Tag color={record.orientation === 'portrait' ? 'magenta' : 'blue'}>
					{record.resolution_width} × {record.resolution_height}
				</Tag>
				<div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
					{record.aspect_ratio || '16:9'} • {record.orientation}
				</div>
			</div>
		),
	},
	{
		title: 'Loop / Pacing',
		key: 'loop',
		width: 140,
		render: (_: unknown, record: ScreenItem) => (
			<span style={{ fontSize: 12 }}>
				{record.loop_duration_seconds ?? 120}s Loop ({record.default_slot_seconds ?? 15}s/slot)
			</span>
		),
	},
	{
		title: 'Connection',
		dataIndex: 'connectivity_status',
		key: 'connectivity_status',
		width: 110,
		render: (val: string) => <StatusTag status={val || 'offline'} />,
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: (status: string) => <StatusTag status={status || 'active'} />,
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 150,
		render: (_: unknown, record: ScreenItem) => (
			<Space size="small">
				<Tooltip title="Edge Player Simulator">
					<Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => onPreview(record)} />
				</Tooltip>
				<Tooltip title="Player Auth Key">
					<Button type="link" size="small" icon={<KeyOutlined />} onClick={() => onShowCredentials(record)} />
				</Tooltip>
				<Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete Screen" description="Delete this screen from delivery playlists?" onConfirm={() => onDelete(record.id)} okText="Yes" cancelText="No">
					<Button type="link" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
