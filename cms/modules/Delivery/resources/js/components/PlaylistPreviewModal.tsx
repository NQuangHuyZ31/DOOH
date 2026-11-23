import React from 'react';
import { Modal, Table, Tag, Statistic, Row, Col, Card } from 'antd';
import type { PlaylistPreviewData, PlaylistSlotItem } from '../types/delivery';

interface PlaylistPreviewModalProps {
	open: boolean;
	data: PlaylistPreviewData | null;
	loading?: boolean;
	onClose: () => void;
}

export const PlaylistPreviewModal: React.FC<PlaylistPreviewModalProps> = ({ open, data, loading, onClose }) => {
	const columns = [
		{
			title: 'Slot #',
			key: 'slot',
			width: 70,
			render: (_: unknown, __: unknown, idx: number) => <Tag color="blue">#{idx + 1}</Tag>,
		},
		{
			title: 'Line Item',
			dataIndex: 'line_item_name',
			key: 'line_item_name',
			render: (name: string, record: PlaylistSlotItem) => (
				<div>
					<strong>{name}</strong>
					<div style={{ fontSize: 11, color: '#8c8c8c' }}>Priority: {record.priority}/10</div>
				</div>
			),
		},
		{
			title: 'Format',
			dataIndex: 'type',
			key: 'type',
			width: 100,
			render: (type: string) => <Tag color="purple">{type.toUpperCase()}</Tag>,
		},
		{
			title: 'Duration',
			dataIndex: 'duration',
			key: 'duration',
			width: 90,
			render: (dur: number) => `${dur}s`,
		},
		{
			title: 'Media Asset',
			dataIndex: 'media_url',
			key: 'media_url',
			render: (url: string) => (
				<a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, wordBreak: 'break-all' }}>
					{url ? url.split('/').pop() || url : '—'}
				</a>
			),
		},
	];

	return (
		<Modal open={open} title="Live Ad Loop Playlist Preview" onCancel={onClose} footer={null} width={760}>
			<Row gutter={16} style={{ marginBottom: 16 }}>
				<Col span={8}>
					<Card size="small"><Statistic title="Total Loop Duration" value={data?.total_duration_seconds || 0} suffix="seconds" /></Card>
				</Col>
				<Col span={8}>
					<Card size="small"><Statistic title="Total Ad Slots" value={data?.slots_count || 0} suffix="items" /></Card>
				</Col>
				<Col span={8}>
					<Card size="small"><Statistic title="Player Poll Interval" value={data?.refresh_seconds || 120} suffix="seconds" /></Card>
				</Col>
			</Row>

			<Table<PlaylistSlotItem>
				columns={columns}
				dataSource={data?.playlist || []}
				rowKey={(_, idx) => String(idx)}
				loading={loading}
				pagination={false}
				size="small"
			/>
		</Modal>
	);
};

export default PlaylistPreviewModal;
