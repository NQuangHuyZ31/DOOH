import React from 'react';
import { Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { StatusTag } from '@core/components/StatusTag';
import type { VendorItem } from '../types/vendor';

interface ColumnActions {
	onEdit: (item: VendorItem) => void;
	onDelete: (id: number) => void;
	onRegenerateKey: (item: VendorItem) => void;
}

export const getVendorColumns = ({ onEdit, onDelete, onRegenerateKey }: ColumnActions) => [
	{
		title: 'Code',
		dataIndex: 'code',
		key: 'code',
		width: 140,
		render: (code: string) => <Tag color="purple">{code}</Tag>,
	},
	{
		title: 'Vendor / Media Owner',
		dataIndex: 'name',
		key: 'name',
		render: (name: string, record: VendorItem) => (
			<div>
				<strong>{name}</strong>
				{record.company_name && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.company_name}</div>}
				{record.tax_code && <div style={{ fontSize: 11, color: '#bfbfbf' }}>Tax: {record.tax_code}</div>}
			</div>
		),
	},
	{
		title: 'Contact',
		key: 'contact',
		width: 200,
		render: (_: unknown, record: VendorItem) => (
			<div style={{ fontSize: 12 }}>
				{record.contact_name && <div><strong>{record.contact_name}</strong></div>}
				{record.contact_phone && <div><PhoneOutlined style={{ marginRight: 4 }} />{record.contact_phone}</div>}
				{record.contact_email && <div><MailOutlined style={{ marginRight: 4 }} />{record.contact_email}</div>}
			</div>
		),
	},
	{
		title: 'API Ingestion Key',
		key: 'api_key',
		width: 180,
		render: (_: unknown, record: VendorItem) => (
			<Space>
				{record.has_api_key ? (
					<Tooltip title="Active Partner Ingestion Key">
						<Tag color="cyan">{record.api_key_prefix}...</Tag>
					</Tooltip>
				) : (
					<Tag color="default">No Key</Tag>
				)}
				<Tooltip title="Regenerate API Key">
					<Button size="small" icon={<KeyOutlined />} onClick={() => onRegenerateKey(record)} />
				</Tooltip>
			</Space>
		),
	},
	{
		title: 'Rev Share',
		dataIndex: 'revenue_share_percentage',
		key: 'revenue_share_percentage',
		width: 110,
		render: (val: number) => <Tag color="blue">{val}%</Tag>,
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
		render: (status: string) => <StatusTag status={status} />,
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 110,
		render: (_: unknown, record: VendorItem) => (
			<Space size="small">
				<Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				<Popconfirm title="Delete Vendor?" description="Are you sure you want to delete this vendor?" onConfirm={() => onDelete(record.id)} okText="Delete" okType="danger">
					<Button type="text" size="small" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			</Space>
		),
	},
];
