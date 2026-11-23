import React, { useEffect, useState } from 'react';
import { Modal, Button, message, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppSelector } from '@core/store/hooks';
import { hasRole } from '@core/utils/permission';
import { extractMediaMetadata, calcOrientation, getDimsForOrientation } from '@core/utils/mediaExtractor';
import { CreativeBatchRow } from './CreativeBatchRow';
import type { CreativeItem, CreativeFormData, CreativeRowItem } from '../types/creative';

interface CreativeFormModalProps {
	open: boolean;
	initialValues?: CreativeItem | null;
	submitting?: boolean;
	targetOrientation?: string;
	onCancel: () => void;
	onSave: (items: CreativeFormData[]) => Promise<void>;
}

const createDefaultRow = (id: string, orient?: string): CreativeRowItem => ({
	id, name: '', type: 'video', status: 'pending_review', sourceType: 'file', media_url: '',
	...getDimsForOrientation(orient), duration_seconds: 15,
});

export const CreativeFormModal: React.FC<CreativeFormModalProps> = ({ open, initialValues, submitting = false, targetOrientation, onCancel, onSave }) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const canReview = hasRole(currentUser, ['admin', 'operator', 'ads_ops']);
	const [rows, setRows] = useState<CreativeRowItem[]>([createDefaultRow('row-1', targetOrientation)]);

	useEffect(() => {
		if (open) {
			setRows(initialValues ? [{
				id: `edit-${initialValues.id}`, name: initialValues.name, type: initialValues.type, status: initialValues.status,
				sourceType: 'url', media_url: initialValues.media_url, width: initialValues.width, height: initialValues.height,
				duration_seconds: initialValues.type === 'image' ? null : initialValues.duration_seconds,
			}] : [createDefaultRow(`row-${Date.now()}`, targetOrientation)]);
		}
	}, [open, initialValues, targetOrientation]);

	const handleRowChange = (id: string, updates: Partial<CreativeRowItem>) => {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
	};

	const handleFileUploaded = async (id: string, url: string, file?: File) => {
		const isChanged = initialValues && url !== initialValues.media_url;
		const statusUpdate = isChanged && !canReview ? { status: 'pending_review' as const } : {};
		if (file) {
			const curRow = rows.find((r) => r.id === id);
			try {
				const meta = await extractMediaMetadata(file, curRow?.type);
				const fileOrient = calcOrientation(meta.width, meta.height);
				const orientMismatch = targetOrientation && targetOrientation !== 'custom' && fileOrient !== targetOrientation;
				const orientErr = orientMismatch ? `Aspect mismatch: ${meta.width}×${meta.height} (${fileOrient.toUpperCase()}). Expected ${targetOrientation.toUpperCase()}.` : undefined;
				if (orientMismatch) message.warning(orientErr);
				handleRowChange(id, {
					name: file.name.replace(/\.[^/.]+$/, ''), type: meta.type, width: meta.width, height: meta.height,
					duration_seconds: curRow?.type === 'image' ? null : meta.duration, media_url: url, file_size_bytes: file.size, mime_type: file.type,
					error: orientErr ? { orientation: orientErr } : undefined, ...statusUpdate,
				});
			} catch { handleRowChange(id, { media_url: url, error: { media: 'Failed to extract metadata' }, ...statusUpdate }); }
		} else { handleRowChange(id, { media_url: url, error: undefined, ...statusUpdate }); }
	};

	const handleSubmit = async () => {
		let hasError = false;
		const updatedRows = rows.map((r) => {
			const rowErrors: Record<string, string> = {};
			if (!r.name.trim()) rowErrors.name = 'Creative name is required';
			if (!r.media_url.trim()) rowErrors.media = 'Please select a file or enter media URL';
			if (targetOrientation && targetOrientation !== 'custom') {
				const rowOrient = calcOrientation(r.width || 1920, r.height || 1080);
				if (rowOrient !== targetOrientation) rowErrors.orientation = `Must be ${targetOrientation.toUpperCase()} (got ${rowOrient.toUpperCase()})`;
			}
			if (Object.keys(rowErrors).length > 0) hasError = true;
			return { ...r, error: Object.keys(rowErrors).length > 0 ? rowErrors : undefined };
		});

		if (hasError) {
			setRows(updatedRows);
			message.error('Please resolve highlighted errors in red before saving.');
			return;
		}

		await onSave(rows.map((r) => ({
			name: r.name, type: r.type, status: canReview ? r.status : 'pending_review', media_url: r.media_url,
			width: r.width, height: r.height, duration_seconds: r.type === 'image' ? null : r.duration_seconds,
			file_size_bytes: r.file_size_bytes, mime_type: r.mime_type,
		})));
	};

	return (
		<Modal open={open} title={initialValues ? `Edit: ${initialValues.name}` : `Upload Creatives (${rows.length} asset${rows.length > 1 ? 's' : ''})`} onCancel={onCancel} onOk={handleSubmit} confirmLoading={submitting} width={1140} okText={initialValues ? 'Save Changes' : `Save All (${rows.length}) Assets`} destroyOnClose>
			{targetOrientation && targetOrientation !== 'custom' && (
				<Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`Orientation Locked: ${targetOrientation.toUpperCase()}. Uploaded media must match this orientation.`} />
			)}
			<div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
				{rows.map((row, idx) => (
					<CreativeBatchRow key={row.id} row={row} index={idx} canDelete={rows.length > 1 && !initialValues} canReview={canReview} onChange={handleRowChange} onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))} onFileUploaded={handleFileUploaded} />
				))}
			</div>
			{!initialValues && (
				<Button type="dashed" icon={<PlusOutlined />} onClick={() => setRows((prev) => [...prev, createDefaultRow(`row-${Date.now()}`, targetOrientation)])} block style={{ marginTop: 8 }}>
					+ Add Another Creative Row
				</Button>
			)}
		</Modal>
	);
};

export default CreativeFormModal;
