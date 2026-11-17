import React from 'react';
import { Tag } from 'antd';
import { STATUS_TAG_MAP } from '../configs/status';

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
  const config = STATUS_TAG_MAP[status.toLowerCase()] || { color: 'default', label: status };

  return <Tag color={config.color}>{text || config.label}</Tag>;
};

export default StatusTag;
