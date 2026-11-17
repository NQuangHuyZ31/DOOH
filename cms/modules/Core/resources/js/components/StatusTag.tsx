import React from 'react';
import { Tag } from 'antd';

export type StatusType = 'active' | 'paused' | 'completed' | 'draft' | 'inactive' | 'error' | string;

interface StatusTagProps {
  status: StatusType;
  text?: string;
}

const statusMap: Record<string, { color: string; label: string }> = {
  active: { color: 'success', label: 'Active' },
  running: { color: 'processing', label: 'Running' },
  paused: { color: 'warning', label: 'Paused' },
  completed: { color: 'default', label: 'Completed' },
  draft: { color: 'default', label: 'Draft' },
  inactive: { color: 'error', label: 'Inactive' },
  error: { color: 'error', label: 'Error' },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status, text }) => {
  const config = statusMap[status.toLowerCase()] || { color: 'default', label: status };

  return <Tag color={config.color}>{text || config.label}</Tag>;
};

export default StatusTag;
