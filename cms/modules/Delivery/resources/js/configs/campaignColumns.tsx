import React from 'react';
import { Space, Button, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { CampaignItem } from '../types/delivery';

interface CampaignColumnActions {
	onEdit: (item: CampaignItem) => void;
	onDelete: (id: number) => void;
}

export const getCampaignColumns = ({ onEdit, onDelete }: CampaignColumnActions) => [
	{
		title: 'Code',
		dataIndex: 'code',
		key: 'code',
		width: 140,
		render: (code: string) => <Tag color="blue">{code}</Tag>,
	},
	{
		title: 'Campaign Name',
		dataIndex: 'name',
		key: 'name',
		render: (name: string, record: CampaignItem) => (
			<div>
				<strong>{name}</strong>
				{record.description && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description}</div>}
			</div>
		),
	},
	{
		title: 'Flight Dates',
		key: 'dates',
		width: 190,
		render: (_: unknown, record: CampaignItem) => {
			if (!record.start_date && !record.end_date) return <span>—</span>;
			return <span style={{ fontSize: 12 }}>{record.start_date || '—'} → {record.end_date || '—'}</span>;
		},
	},
	{
		title: 'Budget',
		dataIndex: 'total_budget',
		key: 'total_budget',
		width: 130,
		render: (budget: number | string | null) => (budget != null && !isNaN(Number(budget)) ? `${Number(budget).toLocaleString()} VND` : '—'),
	},
	{
		title: 'Line Items',
		dataIndex: 'line_items_count',
		key: 'line_items_count',
		width: 100,
		render: (count: number) => <Tag color="purple">{count || 0} items</Tag>,
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: (status: string) => <StatusTag status={status || 'draft'} />,
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 100,
		render: (_: unknown, record: CampaignItem) => (
			<Space size="small">
				<Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete Campaign?" description="Are you sure you want to delete this campaign?" onConfirm={() => onDelete(record.id)} okText="Delete" okType="danger">
					<Button type="text" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
