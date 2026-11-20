import React from 'react';
import { Card, Input, InputNumber, Select, Button, Space, Tag, Radio } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FileUpload } from '@core/components/FileUpload';
import { useAppSelector } from '@core/store/hooks';
import type { CreativeRowItem, CreativeStatus, CreativeType } from '../types/creative';

interface CreativeBatchRowProps {
	row: CreativeRowItem;
	index: number;
	canDelete: boolean;
	canReview?: boolean;
	onChange: (id: string, updates: Partial<CreativeRowItem>) => void;
	onDelete: (id: string) => void;
	onFileUploaded: (id: string, url: string, file?: File) => void;
}

const TYPE_UPLOAD_CFG: Record<CreativeType, { accept: string; buttonText: string; maxSizeMb: number }> = {
	video: { accept: 'video/mp4,video/quicktime,.mp4,.mov', buttonText: 'Upload Video (MP4)', maxSizeMb: 100 },
	image: { accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp', buttonText: 'Upload Image (JPG/PNG)', maxSizeMb: 10 },
	html5: { accept: 'application/zip,.zip', buttonText: 'Upload HTML5 ZIP', maxSizeMb: 30 },
	vast: { accept: '', buttonText: 'Enter VAST Tag URL', maxSizeMb: 0 },
};

const DEFAULT_TYPES = [
	{ label: 'Video (MP4)', value: 'video' },
	{ label: 'Image (JPG/PNG/WebP)', value: 'image' },
	{ label: 'HTML5 Package', value: 'html5' },
	{ label: 'VAST XML Tag', value: 'vast' },
];

export const CreativeBatchRow: React.FC<CreativeBatchRowProps> = ({ row, index, canDelete, canReview = false, onChange, onDelete, onFileUploaded }) => {
	const metadata = useAppSelector((state) => state.metadata.data);
	const typeOptions = metadata?.enums?.creative_types || DEFAULT_TYPES;
	const statusOptions = (metadata?.statuses?.creative || []).filter((s) => s.value !== 'rejected');
	const uploadCfg = TYPE_UPLOAD_CFG[row.type] || TYPE_UPLOAD_CFG.video;

	const handleTypeChange = (type: CreativeType) => {
		const updates: Partial<CreativeRowItem> = {
			type,
			duration_seconds: type === 'image' ? null : (row.duration_seconds || 15),
		};
		if (type === 'vast') updates.sourceType = 'url';
		onChange(row.id, updates);
	};

	return (
		<Card size="small" style={{ marginBottom: 12, border: '1px solid #e2e8f0', background: '#fafafa' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
				<Space>
					<Tag color="blue" style={{ fontWeight: 600 }}>{`Row #${index + 1}`}</Tag>
					<Radio.Group size="small" value={row.type === 'vast' ? 'url' : row.sourceType} onChange={(e) => onChange(row.id, { sourceType: e.target.value })}>
						<Radio.Button value="file" disabled={row.type === 'vast'}>
							Upload File
						</Radio.Button>
						<Radio.Button value="url">Enter URL</Radio.Button>
					</Radio.Group>
					{canReview && (
						<Select
							size="small"
							value={row.status || 'pending_review'}
							style={{ width: 140 }}
							disabled={row.status === 'approved'}
							onChange={(val: CreativeStatus) => onChange(row.id, { status: val })}
							options={statusOptions.length > 0 ? statusOptions : undefined}
						/>
					)}
				</Space>
				<Button type="text" danger icon={<DeleteOutlined />} disabled={!canDelete} onClick={() => onDelete(row.id)} />
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2.4fr 1.6fr 0.9fr', gap: 10, alignItems: 'center' }}>
				<Input placeholder="Creative Name..." value={row.name} onChange={(e) => onChange(row.id, { name: e.target.value })} />

				<Select
					value={row.type}
					onChange={handleTypeChange}
					options={typeOptions}
				/>

				{row.sourceType === 'file' && row.type !== 'vast' ? (
					<FileUpload
						folder="creatives"
						accept={uploadCfg.accept}
						maxSizeMb={uploadCfg.maxSizeMb}
						value={row.media_url}
						buttonText={uploadCfg.buttonText}
						onChange={(url, data, file) => onFileUploaded(row.id, url, file)}
					/>
				) : (
					<Input placeholder={row.type === 'vast' ? 'https://example.com/vast.xml' : 'https://cdn.example.com/asset.mp4'} value={row.media_url} onChange={(e) => onChange(row.id, { media_url: e.target.value })} />
				)}

				<Space.Compact style={{ width: '100%' }}>
					<InputNumber prefix="W:" placeholder="Width" value={row.width} min={100} max={10000} onChange={(val) => onChange(row.id, { width: val || 1920 })} style={{ width: '50%' }} />
					<InputNumber prefix="H:" placeholder="Height" value={row.height} min={100} max={10000} onChange={(val) => onChange(row.id, { height: val || 1080 })} style={{ width: '50%' }} />
				</Space.Compact>

				{row.type === 'image' ? (
					<Input disabled value="—" placeholder="N/A" style={{ textAlign: 'center', background: '#f1f5f9', color: '#94a3b8' }} />
				) : (
					<InputNumber addonAfter="s" value={row.duration_seconds ?? 15} min={1} max={300} onChange={(val) => onChange(row.id, { duration_seconds: val || 15 })} style={{ width: '100%' }} />
				)}
			</div>
		</Card>
	);
};

export default CreativeBatchRow;
