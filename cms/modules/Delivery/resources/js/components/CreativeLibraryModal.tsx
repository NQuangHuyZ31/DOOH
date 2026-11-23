import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Select, Space, Tag, Table, Button } from 'antd';
import { SearchOutlined, CheckOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { calcOrientation } from '@core/utils/mediaExtractor';
import { fetchCreatives } from '@modules/Creative/resources/js/store/creativeThunk';
import type { ColumnsType } from 'antd/es/table';
import type { CreativeItem } from '@modules/Creative/resources/js/types/creative';
import type { LineItemCreativeItem } from '../types/delivery';

interface CreativeLibraryModalProps {
	open: boolean;
	alreadyAttachedIds?: number[];
	targetOrientation?: string;
	onCancel: () => void;
	onConfirm: (selected: LineItemCreativeItem[]) => void;
}

const TYPE_COLORS: Record<string, string> = { video: 'blue', image: 'green', html5: 'orange', vast: 'purple' };
const ORIENT_COLORS: Record<string, string> = { landscape: 'cyan', portrait: 'magenta', square: 'blue', ribbon: 'purple', custom: 'default' };

export const CreativeLibraryModal: React.FC<CreativeLibraryModalProps> = ({ open, alreadyAttachedIds = [], targetOrientation, onCancel, onConfirm }) => {
	const dispatch = useAppDispatch();
	const creatives = useAppSelector((state) => state.creative?.creatives || []);
	const loading = useAppSelector((state) => state.creative?.loading || false);
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState<string | undefined>();
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

	useEffect(() => {
		if (open) {
			if (creatives.length === 0) dispatch(fetchCreatives({ per_page: 100 }));
			setSelectedKeys(alreadyAttachedIds);
		}
	}, [open, creatives.length, alreadyAttachedIds, dispatch]);

	const filteredCreatives = useMemo(() => {
		return creatives.filter((c) => {
			if (c.status !== 'approved') return false;
			if (typeFilter && c.type !== typeFilter) return false;
			if (targetOrientation && targetOrientation !== 'custom') {
				if (calcOrientation(c.width || 1920, c.height || 1080) !== targetOrientation) return false;
			}
			if (search.trim()) {
				const q = search.trim().toLowerCase();
				return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
			}
			return true;
		});
	}, [creatives, search, typeFilter, targetOrientation]);

	const handleOk = () => {
		const chosen = creatives
			.filter((c) => selectedKeys.includes(c.id))
			.map((c) => ({
				id: c.id,
				name: c.name,
				code: c.code,
				type: c.type,
				status: c.status,
				media_url: c.media_url,
				width: c.width,
				height: c.height,
				duration_seconds: c.duration_seconds,
				weight: 1,
			}));
		onConfirm(chosen);
	};

	const columns: ColumnsType<CreativeItem> = [
		{ title: 'Code', dataIndex: 'code', width: 140, render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span> },
		{ title: 'Name', dataIndex: 'name', ellipsis: true },
		{ title: 'Type', dataIndex: 'type', width: 100, render: (type: string) => <Tag color={TYPE_COLORS[type] || 'default'}>{type.toUpperCase()}</Tag> },
		{
			title: 'Resolution',
			width: 150,
			render: (_, r) => {
				const orient = calcOrientation(r.width || 1920, r.height || 1080);
				return (
					<Space size={4}>
						<span>{`${r.width || 1920}×${r.height || 1080}`}</span>
						<Tag color={ORIENT_COLORS[orient] || 'default'}>{orient.toUpperCase()}</Tag>
					</Space>
				);
			},
		},
		{ title: 'Duration', dataIndex: 'duration_seconds', width: 90, render: (d, r) => (r.type === 'image' ? '—' : `${d || 15}s`) },
	];

	return (
		<Modal
			open={open}
			title={targetOrientation ? `Creative Library (Matched: ${targetOrientation.toUpperCase()})` : 'Creative Library (Select Approved Assets)'}
			onCancel={onCancel}
			width={940}
			destroyOnClose
			footer={[
				<Button key="cancel" onClick={onCancel}>
					Cancel
				</Button>,
				<Button key="ok" type="primary" icon={<CheckOutlined />} onClick={handleOk} disabled={selectedKeys.length === 0}>
					{`Attach ${selectedKeys.length} Selected Creative${selectedKeys.length > 1 ? 's' : ''}`}
				</Button>,
			]}
		>
			<Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
				<Input placeholder="Search creative by name or code..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 320 }} />
				<Space>
					{targetOrientation && <Tag color="geekblue">{`Orientation Locked: ${targetOrientation.toUpperCase()}`}</Tag>}
					<Select
						placeholder="Filter by Type"
						allowClear
						value={typeFilter}
						onChange={setTypeFilter}
						style={{ width: 140 }}
						options={[
							{ label: 'All Types', value: '' },
							{ label: 'Video', value: 'video' },
							{ label: 'Image', value: 'image' },
							{ label: 'HTML5', value: 'html5' },
							{ label: 'VAST', value: 'vast' },
						]}
					/>
				</Space>
			</Space>
			<Table<CreativeItem>
				rowKey="id"
				size="small"
				columns={columns}
				dataSource={filteredCreatives}
				loading={loading}
				pagination={{ pageSize: 8, showSizeChanger: false }}
				rowSelection={{
					selectedRowKeys: selectedKeys,
					onChange: (keys) => setSelectedKeys(keys),
				}}
				scroll={{ y: 340 }}
			/>
		</Modal>
	);
};

export default CreativeLibraryModal;
