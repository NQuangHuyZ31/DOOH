import React from 'react';
import { Table, Tag, InputNumber, Button, Empty, Space, Typography } from 'antd';
import { DeleteOutlined, VideoCameraOutlined, PictureOutlined, AppstoreAddOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { LineItemCreativeItem } from '../types/delivery';

const { Text } = Typography;

interface LineItemCreativeListProps {
	creatives: LineItemCreativeItem[];
	currentOrientation: string;
	onOpenLibrary: () => void;
	onOpenUpload: () => void;
	onChange: (updated: LineItemCreativeItem[]) => void;
	onRemove: (id: number) => void;
}

const TYPE_COLORS: Record<string, string> = { video: 'blue', image: 'green', html5: 'orange', vast: 'purple' };
const ORIENT_COLORS: Record<string, string> = { landscape: 'cyan', portrait: 'magenta', square: 'blue', ribbon: 'purple', custom: 'default' };

export const LineItemCreativeList: React.FC<LineItemCreativeListProps> = ({ creatives, currentOrientation, onOpenLibrary, onOpenUpload, onChange, onRemove }) => {
	const handleWeightChange = (id: number, weight: number | null) => {
		onChange(creatives.map((c) => (c.id === id ? { ...c, weight: weight || 1 } : c)));
	};

	const columns: ColumnsType<LineItemCreativeItem> = [
		{
			title: 'Creative Name',
			dataIndex: 'name',
			render: (name, r) => (
				<Space>
					{r.type === 'video' ? <VideoCameraOutlined style={{ color: '#1890ff' }} /> : <PictureOutlined style={{ color: '#52c41a' }} />}
					<div>
						<div style={{ fontWeight: 600 }}>{name}</div>
						{r.code && <div style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>{r.code}</div>}
					</div>
				</Space>
			),
		},
		{
			title: 'Type',
			dataIndex: 'type',
			width: 90,
			render: (type: string) => <Tag color={TYPE_COLORS[type] || 'default'}>{type.toUpperCase()}</Tag>,
		},
		{
			title: 'Specs',
			width: 140,
			render: (_, r) => (
				<span style={{ fontSize: 12 }}>
					{`${r.width || 1920}×${r.height || 1080}`}
					{r.type !== 'image' && <span style={{ color: '#8c8c8c' }}>{` (${r.duration_seconds || 15}s)`}</span>}
				</span>
			),
		},
		{
			title: 'Weight (Rotation)',
			dataIndex: 'weight',
			width: 130,
			render: (weight, r) => <InputNumber size="small" min={1} max={100} value={weight || 1} onChange={(val) => handleWeightChange(r.id, val)} style={{ width: 75 }} />,
		},
		{
			title: '',
			width: 50,
			render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onRemove(r.id)} />,
		},
	];

	return (
		<div style={{ marginTop: 8, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
				<Space direction="vertical" size={0}>
					<Space>
						<Text strong>Associated Creatives (GAM N-N Rotation)</Text>
						<Tag color={ORIENT_COLORS[currentOrientation] || 'default'}>{currentOrientation.toUpperCase()}</Tag>
					</Space>
					<Text type="secondary" style={{ fontSize: 12 }}>Only assets matching {currentOrientation.toUpperCase()} can be attached to ensure perfect playback.</Text>
				</Space>
				<Space>
					<Button icon={<AppstoreAddOutlined />} onClick={onOpenLibrary}>Choose from Library</Button>
					<Button type="primary" ghost icon={<UploadOutlined />} onClick={onOpenUpload}>Upload New Creative</Button>
				</Space>
			</div>
			{creatives.length === 0 ? (
				<div style={{ border: '1px dashed #d9d9d9', borderRadius: 6, padding: '20px 0', textAlign: 'center', background: '#fafafa' }}>
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No creatives attached yet. Upload a new asset or choose from the library." />
				</div>
			) : (
				<Table<LineItemCreativeItem> size="small" rowKey="id" columns={columns} dataSource={creatives} pagination={false} scroll={{ y: 200 }} />
			)}
		</div>
	);
};

export default LineItemCreativeList;
