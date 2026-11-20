import React from 'react';
import { Space, Tag, Button, Tooltip, Image } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, VideoCameraOutlined, PictureOutlined, CodeOutlined, LinkOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { StatusTag } from '@core/components/StatusTag';
import type { CreativeItem, CreativeType, CreativeStatus } from '../types/creative';

interface CreativeColumnsProps {
	onPreview: (creative: CreativeItem) => void;
	onEdit: (creative: CreativeItem) => void;
	onDelete: (creative: CreativeItem) => void;
}

const typeIconMap: Record<CreativeType, React.ReactNode> = {
	video: <VideoCameraOutlined />,
	image: <PictureOutlined />,
	html5: <CodeOutlined />,
	vast: <LinkOutlined />,
};

const typeColorMap: Record<CreativeType, string> = {
	video: 'blue',
	image: 'green',
	html5: 'purple',
	vast: 'orange',
};

export const getCreativeColumns = ({ onPreview, onEdit, onDelete }: CreativeColumnsProps): ColumnsType<CreativeItem> => [
	{
		title: 'Asset',
		key: 'asset',
		width: 260,
		render: (_, record) => (
			<Space direction="horizontal" align="center" size="middle">
				{record.thumbnail_url || (record.type === 'image' && record.media_url) ? (
					<Image src={record.thumbnail_url || record.media_url} alt={record.name} width={54} height={36} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
				) : (
					<div style={{ width: 54, height: 36, background: '#f1f5f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>{typeIconMap[record.type]}</div>
				)}
				<div>
					<div style={{ fontWeight: 600, color: '#1e293b' }}>{record.name}</div>
					<div style={{ fontSize: 12, color: '#94a3b8' }}>
						{record.code} • By {record.creator?.name || 'System'}
					</div>
				</div>
			</Space>
		),
	},
	{
		title: 'Type',
		dataIndex: 'type',
		key: 'type',
		width: 110,
		render: (type: CreativeType) => (
			<Tag icon={typeIconMap[type]} color={typeColorMap[type]}>
				{type.toUpperCase()}
			</Tag>
		),
	},
	{
		title: 'Resolution',
		key: 'resolution',
		width: 140,
		render: (_, record) => (
			<div>
				<div>{`${record.width}×${record.height}`}</div>
				<Tag style={{ fontSize: 11, margin: 0 }}>{record.aspect_ratio || 'Custom'}</Tag>
			</div>
		),
	},
	{
		title: 'Duration',
		dataIndex: 'duration_seconds',
		key: 'duration_seconds',
		width: 90,
		render: (sec: number | null, record: CreativeItem) => (
			record.type === 'image' || !sec ? (
				<span style={{ color: '#94a3b8' }}>—</span>
			) : (
				<Tag color="geekblue">{`${sec}s`}</Tag>
			)
		),
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 130,
		render: (status: CreativeStatus, record) => (
			<Tooltip title={record.rejection_reason || undefined}>
				<span>
					<StatusTag status={status} />
				</span>
			</Tooltip>
		),
	},
	{
		title: 'Actions',
		key: 'actions',
		width: 130,
		render: (_, record) => (
			<Space size="small">
				<Tooltip title="Preview & Review">
					<Button type="text" icon={<EyeOutlined />} onClick={() => onPreview(record)} />
				</Tooltip>
				<Tooltip title="Edit Asset">
					<Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
				</Tooltip>
				<Tooltip title="Delete Asset">
					<Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
				</Tooltip>
			</Space>
		),
	},
];

export default getCreativeColumns;
