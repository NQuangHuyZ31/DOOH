import React, { useState } from 'react';
import { Modal, Tag, Descriptions, Button, Space, Input, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '@core/store/hooks';
import { hasRole, isSuperAdmin } from '@core/utils/permission';
import type { CreativeItem, CreativeReviewPayload } from '../types/creative';

interface CreativePreviewModalProps {
	open: boolean;
	creative: CreativeItem | null;
	submitting?: boolean;
	onCancel: () => void;
	onReview: (id: number, payload: CreativeReviewPayload) => Promise<void>;
}

interface VastMeta {
	primary_media_url?: string;
	version?: string;
	impressions?: unknown[];
	tracking_events?: Record<string, unknown>;
}

export const CreativePreviewModal: React.FC<CreativePreviewModalProps> = ({ open, creative, submitting = false, onCancel, onReview }) => {
	const currentUser = useAppSelector((state) => state.auth.user);
	const [rejectMode, setRejectMode] = useState(false);
	const [reason, setReason] = useState('');

	if (!creative) return null;

	const canReview = isSuperAdmin(currentUser) || hasRole(currentUser, ['admin', 'operator', 'ads_ops']);
	const isApproved = creative.status === 'approved';
	const canTakeReviewAction = canReview && !isApproved;
	const vastMeta = (creative.metadata as Record<string, unknown>)?.vast as VastMeta | undefined;
	const primaryMediaUrl = typeof vastMeta?.primary_media_url === 'string' ? vastMeta.primary_media_url : null;
	const videoUrl = creative.type === 'video' ? creative.media_url : creative.type === 'vast' && primaryMediaUrl ? primaryMediaUrl : null;

	const handleApprove = async () => {
		await onReview(creative.id, { status: 'approved' });
	};

	const handleReject = async () => {
		if (!rejectMode) {
			setRejectMode(true);
			return;
		}
		if (!reason.trim()) {
			message.warning('Please provide a reason for rejecting this creative.');
			return;
		}
		await onReview(creative.id, { status: 'rejected', rejection_reason: reason.trim() });
		setRejectMode(false);
		setReason('');
	};

	return (
		<Modal
			open={open}
			title={`${creative.status === 'pending_review' ? 'Review & Approve' : 'Asset Preview'}: ${creative.name} [${creative.code}]`}
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
						{canTakeReviewAction && (
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
				{videoUrl ? (
					<video src={videoUrl} controls autoPlay muted style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 4 }} />
				) : creative.type === 'image' ? (
					<img src={creative.media_url} alt={creative.name} style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 4 }} />
				) : creative.type === 'html5' ? (
					<iframe
						src={creative.media_url}
						title={creative.name}
						sandbox="allow-scripts allow-same-origin"
						style={{ width: '100%', height: 360, border: 'none', borderRadius: 4, background: '#ffffff' }}
					/>
				) : (
					<div style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>
						<div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>VAST XML Linear Stream</div>
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
				{creative.type === 'vast' && (
					<Descriptions.Item label="VAST Info" span={2}>
						{vastMeta ? `VAST ${vastMeta.version || '3.0'} • ${vastMeta.impressions?.length || 0} Impression Beacon(s) • ${Object.keys(vastMeta.tracking_events || {}).length} Event(s)` : 'Raw VAST Tag (External)'}
					</Descriptions.Item>
				)}
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
