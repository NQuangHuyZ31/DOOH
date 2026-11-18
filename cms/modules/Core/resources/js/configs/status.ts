export interface StatusTagMeta {
  color: string;
  label: string;
}

export const STATUS_TAG_MAP: Record<string, StatusTagMeta> = {
  active: { color: 'success', label: 'Active' },
  running: { color: 'processing', label: 'Running' },
  paused: { color: 'warning', label: 'Paused' },
  maintenance: { color: 'warning', label: 'Maintenance' },
  pending: { color: 'processing', label: 'Pending' },
  approved: { color: 'success', label: 'Approved' },
  completed: { color: 'default', label: 'Completed' },
  draft: { color: 'default', label: 'Draft' },
  inactive: { color: 'error', label: 'Inactive' },
  rejected: { color: 'error', label: 'Rejected' },
  error: { color: 'error', label: 'Error' },
};
