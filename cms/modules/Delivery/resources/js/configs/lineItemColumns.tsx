import React from 'react';
import { Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { LineItem } from '../types/delivery';

interface LineItemColumnActions {
	onEdit: (item: LineItem) => void;
	onDelete: (id: number) => void;
}

export const getLineItemColumns = ({ onEdit, onDelete }: LineItemColumnActions) => [
	{
		title: 'Code',
		dataIndex: 'code',
		key: 'code',
		width: 140,
		render: (code: string) => <Tag color="blue">{code}</Tag>,
	},
	{
		title: 'Line Item / Campaign',
		dataIndex: 'name',
		key: 'name',
		render: (name: string, record: LineItem) => (
			<div>
				<strong>{name}</strong>
				{record.campaign && <div style={{ fontSize: 12, color: '#1890ff' }}>Campaign: {record.campaign.name}</div>}
			</div>
		),
	},
	{
		title: 'Creatives',
		key: 'creative',
		width: 170,
		render: (_: unknown, record: LineItem) => {
			const list = record.creatives?.length ? record.creatives : record.creative ? [record.creative] : [];
			if (list.length === 0) return <Tag color="default">No Creative</Tag>;
			if (list.length === 1) {
				return (
					<Tooltip title={`Media: ${list[0].media_url}`}>
						<Tag color="geekblue">{list[0].name} ({list[0].type.toUpperCase()})</Tag>
					</Tooltip>
				);
			}
			return (
				<Tooltip title={list.map((c) => `${c.name} (${c.type})`).join(', ')}>
					<Tag color="purple">{`${list.length} Creatives (N-N)`}</Tag>
				</Tooltip>
			);
		},
	},
	{
		title: 'Pacing & Priority',
		key: 'pacing',
		width: 160,
		render: (_: unknown, record: LineItem) => (
			<Space direction="vertical" size={2}>
				<Tag color={record.pacing_mode === 'asap' ? 'orange' : 'cyan'}>
					Pacing: {record.pacing_mode.toUpperCase()}
				</Tag>
				<Tag color="purple">Priority: {record.priority}/10</Tag>
			</Space>
		),
	},
	{
		title: 'Caps (Daily / Total)',
		key: 'caps',
		width: 160,
		render: (_: unknown, record: LineItem) => (
			<div style={{ fontSize: 12 }}>
				<div>Daily: <strong>{record.daily_impression_cap.toLocaleString()}</strong></div>
				<div>Total: {record.target_impressions.toLocaleString()}</div>
			</div>
		),
	},
	{
		title: 'Target Screens',
		key: 'screens',
		width: 140,
		render: (_: unknown, record: LineItem) => {
			const count = record.screens?.length || record.venues?.length || 0;
			const isLand = (record.orientation || 'landscape') === 'landscape';
			return (
				<Space direction="vertical" size={2}>
					<Tag color="green">{count} screen{count !== 1 ? 's' : ''}</Tag>
					<Tag color={isLand ? 'cyan' : 'magenta'}>{(record.orientation || 'landscape').toUpperCase()}</Tag>
				</Space>
			);
		},
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: (status: string) => <StatusTag status={status} />,
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 100,
		render: (_: unknown, record: LineItem) => (
			<Space size="small">
				<Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete Line Item?" description="Are you sure you want to delete this line item?" onConfirm={() => onDelete(record.id)} okText="Delete" okType="danger">
					<Button type="text" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
