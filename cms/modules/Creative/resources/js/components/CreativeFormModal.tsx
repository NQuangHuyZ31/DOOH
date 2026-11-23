import React, { useEffect, useState } from 'react';
import { Modal, Button, message, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppSelector } from '@core/store/hooks';
import { hasRole } from '@core/utils/permission';
import { extractMediaMetadata } from '../utils/mediaExtractor';
import { CreativeBatchRow } from './CreativeBatchRow';
import type { CreativeItem, CreativeFormData, CreativeRowItem } from '../types/creative';

interface CreativeFormModalProps {
	open: boolean;
	initialValues?: CreativeItem | null;
	submitting?: boolean;
	onCancel: () => void;
	onSave: (items: CreativeFormData[]) => Promise<void>;
}

const createDefaultRow = (id: string): CreativeRowItem => ({
	id,
	name: '',
	type: 'video',
	status: 'pending_review',
	sourceType: 'file',
	media_url: '',
	width: 1920,
	height: 1080,
	duration_seconds: 15,
});

export const CreativeFormModal: React.FC<CreativeFormModalProps> = ({ open, initialValues, submitting = false, onCancel, onSave }) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const canReview = hasRole(currentUser, ['admin', 'operator', 'ads_ops']);
	const [rows, setRows] = useState<CreativeRowItem[]>([createDefaultRow('row-1')]);

	useEffect(() => {
		if (open) {
			setRows(
				initialValues
					? [
							{
								id: `edit-${initialValues.id}`,
								name: initialValues.name,
								type: initialValues.type,
								status: initialValues.status,
								sourceType: 'url',
								media_url: initialValues.media_url,
								width: initialValues.width,
								height: initialValues.height,
								duration_seconds: initialValues.type === 'image' ? null : initialValues.duration_seconds,
							},
						]
					: [createDefaultRow(`row-${Date.now()}`)],
			);
		}
	}, [open, initialValues]);

	const handleRowChange = (id: string, updates: Partial<CreativeRowItem>) => {
		setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
	};

	const handleFileUploaded = async (id: string, url: string, file?: File) => {
		const isMediaChanged = initialValues && url !== initialValues.media_url;
		const statusUpdate = isMediaChanged && !canReview ? { status: 'pending_review' as const } : {};
		if (file) {
			const currentRow = rows.find((r) => r.id === id);
			try {
				const meta = await extractMediaMetadata(file, currentRow?.type);
				handleRowChange(id, {
					name: file.name.replace(/\.[^/.]+$/, ''),
					type: meta.type,
					width: meta.width,
					height: meta.height,
					duration_seconds: currentRow?.type === 'image' ? null : meta.duration,
					media_url: url,
					file_size_bytes: file.size,
					mime_type: file.type,
					...statusUpdate,
				});
			} catch {
				handleRowChange(id, { media_url: url, ...statusUpdate });
			}
		} else {
			handleRowChange(id, { media_url: url, ...statusUpdate });
		}
	};

	const handleSubmit = async () => {
		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			if (!r.name.trim()) return message.error(`Row #${i + 1}: Please enter a name.`);
			if (!r.media_url.trim()) return message.error(`Row #${i + 1}: Please select a file or enter a media URL.`);
		}
		await onSave(
			rows.map((r) => {
				const isMediaChanged = initialValues && r.media_url !== initialValues.media_url;
				const status = isMediaChanged && !canReview ? 'pending_review' : canReview ? r.status : 'pending_review';
				return {
					name: r.name,
					type: r.type,
					status,
					media_url: r.media_url,
					width: r.width,
					height: r.height,
					duration_seconds: r.type === 'image' ? null : r.duration_seconds,
					file_size_bytes: r.file_size_bytes,
					mime_type: r.mime_type,
				};
			}),
		);
	};

	return (
		<Modal
			open={open}
			title={initialValues ? `Edit: ${initialValues.name}` : `Upload Creatives (${rows.length} asset${rows.length > 1 ? 's' : ''})`}
			onCancel={onCancel}
			onOk={handleSubmit}
			confirmLoading={submitting}
			width={1140}
			okText={initialValues ? 'Save Changes' : `Save All (${rows.length}) Assets`}
			destroyOnClose
		>
			<Alert
				type="info"
				showIcon
				message={canReview ? "You have Ad Ops reviewer permissions: you can directly set status to 'Approved' or keep 'Pending Review'." : "All creatives will be submitted as 'Pending Review' for Ad Ops verification."}
				style={{ marginBottom: 16 }}
			/>
			<div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
				{rows.map((row, idx) => (
					<CreativeBatchRow
						key={row.id}
						row={row}
						index={idx}
						canDelete={rows.length > 1 && !initialValues}
						canReview={canReview}
						onChange={handleRowChange}
						onDelete={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
						onFileUploaded={handleFileUploaded}
					/>
				))}
			</div>
			{!initialValues && (
				<Button type="dashed" icon={<PlusOutlined />} onClick={() => setRows((prev) => [...prev, createDefaultRow(`row-${Date.now()}`)])} block style={{ marginTop: 8 }}>
					+ Add Another Creative Row
				</Button>
			)}
		</Modal>
	);
};

export default CreativeFormModal;
