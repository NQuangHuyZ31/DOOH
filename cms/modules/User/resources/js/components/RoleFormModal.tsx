import React, { useEffect, useMemo } from 'react';
import { Alert, Form, Input, Modal, Select } from 'antd';
import type { PermissionItem, RoleFormData, RoleItem } from '../types/role';

export interface RoleFormModalProps {
	open: boolean;
	editingRole: RoleItem | null;
	permissions: PermissionItem[];
	submitting: boolean;
	onCancel: () => void;
	onSubmit: (values: RoleFormData) => Promise<void>;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, editingRole, permissions, submitting, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const isSuperAdmin = editingRole?.name === 'super_admin';

	const groupedPermissionOptions = useMemo(() => {
		const groups: Record<string, { label: string; value: number }[]> = {};
		for (const p of permissions) {
			const mod = (p.module || 'general').toUpperCase();
			if (!groups[mod]) groups[mod] = [];
			groups[mod].push({
				label: `${p.display_name || p.name} (${p.name})`,
				value: p.id,
			});
		}
		return Object.entries(groups).map(([group, options]) => ({
			label: group,
			options,
		}));
	}, [permissions]);

	useEffect(() => {
		if (open) {
			if (editingRole) {
				const assignedPermissionIds = (editingRole.permissions || []).map((p) => p.id);
				form.setFieldsValue({
					name: editingRole.name,
					display_name: editingRole.display_name,
					description: editingRole.description,
					permissions: assignedPermissionIds,
				});
			} else {
				form.resetFields();
			}
		}
	}, [open, editingRole, form]);

	const handleOk = async () => {
		const values = await form.validateFields();
		await onSubmit(values);
	};

	return (
		<Modal open={open} title={editingRole ? `Edit Role: ${editingRole.display_name}` : 'Create New Role'} confirmLoading={submitting} onOk={handleOk} onCancel={onCancel} destroyOnClose>
			<Form form={form} layout="vertical" preserve={false}>
				{isSuperAdmin && <Alert type="info" showIcon message="Super Admin Role" description="Super admin has unrestricted access to all modules and bypasses permission checks." style={{ marginBottom: 16 }} />}

				<Form.Item
					name="name"
					label="Role Identifier (Slug)"
					rules={[
						{ required: true, message: 'Please enter role identifier' },
						{ pattern: /^[a-z0-9_]+$/, message: 'Only lowercase letters, numbers, and underscores' },
						{ min: 2, message: 'Role identifier must be at least 2 characters' },
						{ max: 50, message: 'Role identifier cannot exceed 50 characters' },
					]}
				>
					<Input placeholder="e.g. content_manager" disabled={Boolean(editingRole)} />
				</Form.Item>

				<Form.Item
					name="display_name"
					label="Display Name"
					rules={[
						{ required: true, message: 'Please enter display name' },
						{ min: 2, message: 'Display name must be at least 2 characters' },
						{ max: 100, message: 'Display name cannot exceed 100 characters' },
					]}
				>
					<Input placeholder="e.g. Content Manager" />
				</Form.Item>

				<Form.Item
					name="description"
					label="Description"
					rules={[{ max: 255, message: 'Description cannot exceed 255 characters' }]}
				>
					<Input.TextArea placeholder="Brief description of this role's purpose" rows={3} />
				</Form.Item>

				{!isSuperAdmin && (
					<Form.Item name="permissions" label="Assigned Permissions">
						<Select mode="multiple" placeholder="Select permissions across modules" options={groupedPermissionOptions} allowClear style={{ width: '100%' }} maxTagCount="responsive" />
					</Form.Item>
				)}
			</Form>
		</Modal>
	);
};

export default RoleFormModal;
