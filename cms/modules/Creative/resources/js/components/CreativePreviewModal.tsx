import React, { useState } from 'react';
import { Modal, Tag, Descriptions, Button, Space, Input } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '@core/store/hooks';
import type { CreativeItem, CreativeReviewPayload } from '../types/creative';

interface CreativePreviewModalProps {
	open: boolean;
	creative: CreativeItem | null;
	submitting?: boolean;
	onCancel: () => void;
	onReview: (id: number, payload: CreativeReviewPayload) => Promise<void>;
}

export const CreativePreviewModal: React.FC<CreativePreviewModalProps> = ({ open, creative, submitting = false, onCancel, onReview }) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const [rejectMode, setRejectMode] = useState(false);
	const [reason, setReason] = useState('');

	if (!creative) return null;

	const canReview = !currentUser?.role || currentUser.role === 'admin' || currentUser.role === 'operator' || (currentUser as any)?.role_name === 'super_admin';

	const handleApprove = async () => {
		await onReview(creative.id, { status: 'approved' });
	};

	const handleReject = async () => {
		if (!rejectMode) {
			setRejectMode(true);
			return;
		}
		await onReview(creative.id, { status: 'rejected', rejection_reason: reason });
		setRejectMode(false);
		setReason('');
	};

	return (
		<Modal
			open={open}
			title={`Asset Preview: ${creative.name} [${creative.code}]`}
			onCancel={() => {
				setRejectMode(false);
				setReason('');
				onCancel();
			}}
			width={760}
			footer={
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>{rejectMode && <Input placeholder="Enter rejection reason..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: 280 }} />}</div>
					<Space>
						<Button onClick={onCancel}>Close</Button>
						{canReview && (
							<>
								<Button danger icon={<CloseCircleOutlined />} onClick={handleReject} loading={submitting}>
									{rejectMode ? 'Confirm Reject' : 'Reject'}
								</Button>
								<Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove} loading={submitting}>
									Approve Asset
								</Button>
							</>
						)}
					</Space>
				</div>
			}
			destroyOnClose
		>
			<div style={{ background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
				{creative.type === 'video' ? (
					<video src={creative.media_url} controls autoPlay muted style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 4 }} />
				) : creative.type === 'image' ? (
					<img src={creative.media_url} alt={creative.name} style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 4 }} />
				) : (
					<div style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>
						<div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>{creative.type === 'html5' ? 'HTML5 Interactive Package' : 'VAST XML Linear Stream'}</div>
						<div style={{ wordBreak: 'break-all', fontSize: 13, color: '#38bdf8' }}>{creative.media_url}</div>
					</div>
				)}
			</div>

			<Descriptions size="small" bordered column={2}>
				<Descriptions.Item label="Type">
					<Tag color="blue">{creative.type.toUpperCase()}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Status">
					<Tag color={creative.status === 'approved' ? 'success' : creative.status === 'rejected' ? 'error' : 'warning'}>{creative.status.toUpperCase()}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="Resolution">{`${creative.width}×${creative.height} (${creative.aspect_ratio})`}</Descriptions.Item>
				<Descriptions.Item label="Duration">{creative.type === 'image' || !creative.duration_seconds ? '— (Static Image)' : `${creative.duration_seconds}s`}</Descriptions.Item>
				<Descriptions.Item label="Created By">{creative.creator ? `${creative.creator.name} (${creative.created_at ? new Date(creative.created_at).toLocaleDateString() : 'N/A'})` : 'System'}</Descriptions.Item>
				<Descriptions.Item label="Reviewed By">
					{creative.approver ? `${creative.approver.name} (${creative.approved_at ? new Date(creative.approved_at).toLocaleDateString() : 'N/A'})` : 'Pending Review'}
				</Descriptions.Item>
				{creative.rejection_reason && (
					<Descriptions.Item label="Rejection Note" span={2}>
						<span style={{ color: '#ef4444' }}>{creative.rejection_reason}</span>
					</Descriptions.Item>
				)}
			</Descriptions>
		</Modal>
	);
};

export default CreativePreviewModal;
