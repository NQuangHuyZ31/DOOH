import React, { useState } from 'react';
import { Card, Input, InputNumber, Select, Button, Space, Tag, Radio, message, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FileUpload } from '@core/components/FileUpload';
import { useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { creativeApi } from '../Action/creativeApi';
import type { CreativeRowItem, CreativeStatus, CreativeType } from '../types/creative';

const { Text } = Typography;

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

export const CreativeBatchRow: React.FC<CreativeBatchRowProps> = ({ row, index, canDelete, canReview = false, onChange, onDelete, onFileUploaded }) => {
	const metadata = useAppSelector((state) => state.metadata.data);
	const [inspecting, setInspecting] = useState(false);
	const typeOptions = metadata?.enums?.creative_types || [];
	const statusOptions = (metadata?.statuses?.creative || []).filter((s) => s.value !== 'rejected');
	const uploadCfg = TYPE_UPLOAD_CFG[row.type] || TYPE_UPLOAD_CFG.video;
	const hasError = Boolean(row.error?.name || row.error?.media || row.error?.orientation || row.error?.general);

	const handleInspectVast = async () => {
		if (!row.media_url?.trim()) return message.warning('Please enter VAST tag URL first.');
		setInspecting(true);
		try {
			const res = await creativeApi.parseVast({ url: row.media_url.trim() });
			const d = res.data?.data;
			if (d) {
				if (d.has_ad === false) {
					message.warning(`VAST ${d.version || ''} responded with empty <VAST/> (no ad fill). Keeping current W/H/Duration.`);
					return;
				}
				onChange(row.id, {
					width: d.width ? Number(d.width) : row.width,
					height: d.height ? Number(d.height) : row.height,
					duration_seconds: d.duration_seconds ? Number(d.duration_seconds) : row.duration_seconds,
					name: row.name || (d.ad_title as string) || row.name,
					error: row.error ? { ...row.error, media: undefined } : undefined,
				});
				message.success(`VAST verified: ${d.version} (${d.width || row.width}×${d.height || row.height}, ${d.duration_seconds || row.duration_seconds || 15}s)`);
			}
		} catch (e: unknown) {
			message.error(extractErrorMessage(e, 'Failed to inspect VAST XML.'));
			onChange(row.id, { error: { ...row.error, media: 'Invalid VAST endpoint.' } });
		} finally { setInspecting(false); }
	};

	const handleTypeChange = (type: CreativeType) => {
		const updates: Partial<CreativeRowItem> = { type, duration_seconds: type === 'image' ? null : row.duration_seconds || 15 };
		if (type === 'vast') updates.sourceType = 'url';
		onChange(row.id, updates);
	};

	return (
		<Card size="small" style={{ marginBottom: 12, border: hasError ? '1px solid #ff4d4f' : '1px solid #e2e8f0', background: hasError ? '#fffaf9' : '#fafafa' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
				<Space>
					<Tag color={hasError ? 'error' : 'blue'} style={{ fontWeight: 600 }}>{`Row #${index + 1}`}</Tag>
					<Radio.Group size="small" value={row.type === 'vast' ? 'url' : row.sourceType} onChange={(e) => onChange(row.id, { sourceType: e.target.value })}>
						<Radio.Button value="file" disabled={row.type === 'vast'}>Upload File</Radio.Button>
						<Radio.Button value="url">Enter URL</Radio.Button>
					</Radio.Group>
					{canReview && (
						<Select size="small" value={row.status || 'pending_review'} style={{ width: 140 }} disabled={row.status === 'approved'} onChange={(val: CreativeStatus) => onChange(row.id, { status: val })} options={statusOptions.length > 0 ? statusOptions : undefined} />
					)}
					{row.error?.general && <Text type="danger" style={{ fontSize: 12 }}>{row.error.general}</Text>}
				</Space>
				<Button type="text" danger icon={<DeleteOutlined />} disabled={!canDelete} onClick={() => onDelete(row.id)} />
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2.4fr 1.6fr 0.9fr', gap: 10, alignItems: 'start' }}>
				<div>
					<Input status={row.error?.name ? 'error' : undefined} placeholder="Creative Name..." value={row.name} onChange={(e) => onChange(row.id, { name: e.target.value, error: row.error ? { ...row.error, name: undefined } : undefined })} />
					{row.error?.name && <Text type="danger" style={{ fontSize: 11, display: 'block' }}>{row.error.name}</Text>}
				</div>

				<Select value={row.type} onChange={handleTypeChange} options={typeOptions} />

				<div>
					{row.sourceType === 'file' && row.type !== 'vast' ? (
						<FileUpload
							folder="creatives" accept={uploadCfg.accept} maxSizeMb={uploadCfg.maxSizeMb} value={row.media_url} buttonText={uploadCfg.buttonText}
							status={row.error?.media || row.error?.orientation ? 'error' : undefined} errorMessage={row.error?.media}
							onChange={(url, data, file) => onFileUploaded(row.id, url, file)} onError={(msg) => onChange(row.id, { error: { ...row.error, media: msg } })}
						/>
					) : (
						<>
							<Input
								status={row.error?.media ? 'error' : undefined} placeholder={row.type === 'vast' ? 'https://example.com/vast.xml' : 'https://cdn.example.com/asset.mp4'}
								value={row.media_url} onChange={(e) => onChange(row.id, { media_url: e.target.value, error: row.error ? { ...row.error, media: undefined } : undefined })}
								addonAfter={row.type === 'vast' ? <Button size="small" type="link" loading={inspecting} onClick={handleInspectVast} style={{ padding: 0 }}>Verify</Button> : undefined}
							/>
							{row.error?.media && <Text type="danger" style={{ fontSize: 11, display: 'block' }}>{row.error.media}</Text>}
						</>
					)}
				</div>

				<div>
					<Space.Compact style={{ width: '100%' }}>
						<InputNumber status={row.error?.orientation ? 'error' : undefined} prefix="W:" placeholder="Width" value={row.width} min={100} max={10000} onChange={(val) => onChange(row.id, { width: val || 1920, error: row.error ? { ...row.error, orientation: undefined } : undefined })} style={{ width: '50%' }} />
						<InputNumber status={row.error?.orientation ? 'error' : undefined} prefix="H:" placeholder="Height" value={row.height} min={100} max={10000} onChange={(val) => onChange(row.id, { height: val || 1080, error: row.error ? { ...row.error, orientation: undefined } : undefined })} style={{ width: '50%' }} />
					</Space.Compact>
					{row.error?.orientation && <Text type="danger" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>{row.error.orientation}</Text>}
				</div>

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
