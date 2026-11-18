import React from 'react';
import { Tag } from 'antd';
import { STATUS_TAG_MAP } from '../configs/status';
import { useAppSelector } from '../store/hooks';

export type StatusType =
	| 'active'
	| 'running'
	| 'paused'
	| 'maintenance'
	| 'pending'
	| 'approved'
	| 'completed'
	| 'draft'
	| 'inactive'
	| 'rejected'
	| 'error'
	| string;

export interface StatusTagProps {
	status: StatusType;
	text?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, text }) => {
	const normalized = status.toLowerCase();
	const metaTag = useAppSelector((state) => state.metadata.data?.statuses?.tags?.[normalized]);
	const config = metaTag || STATUS_TAG_MAP[normalized] || { color: 'default', label: status };

	return <Tag color={config.color}>{text || config.label}</Tag>;
};

export default StatusTag;
