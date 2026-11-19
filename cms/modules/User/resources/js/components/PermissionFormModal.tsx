import React, { useEffect, useMemo } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { useAppSelector } from '@core/store/hooks';
import type { PermissionFormData, PermissionItem } from '../types/permission';

export interface PermissionFormModalProps {
	open: boolean;
	editingPermission: PermissionItem | null;
	submitting: boolean;
	onCancel: () => void;
	onSubmit: (values: PermissionFormData) => Promise<void>;
}

export const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
	open,
	editingPermission,
	submitting,
	onCancel,
	onSubmit,
}) => {
	const [form] = Form.useForm();
	const metadata = useAppSelector((state) => state.metadata.data);
	const selectedModule = Form.useWatch('module', form);
	const actionKey = Form.useWatch('action', form);

	const moduleOptions = useMemo(() => metadata?.enums?.modules || [], [metadata]);

	// Auto-format slug: ${module}.${action} when creating
	useEffect(() => {
		if (!editingPermission && selectedModule) {
			const cleanAction = (actionKey || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
			form.setFieldsValue({ name: cleanAction ? `${selectedModule}.${cleanAction}` : '' });
		}
	}, [selectedModule, actionKey, editingPermission, form]);

	useEffect(() => {
		if (open) {
			if (editingPermission) {
				form.setFieldsValue({
					module: editingPermission.module,
					name: editingPermission.name,
					display_name: editingPermission.display_name,
					description: editingPermission.description,
				});
			} else {
				form.resetFields();
				form.setFieldsValue({ module: moduleOptions[0]?.value || 'user', action: '', name: '' });
			}
		}
	}, [open, editingPermission, form, moduleOptions]);

	const handleOk = async () => {
		const values = await form.validateFields();
		await onSubmit({
			module: values.module,
			name: values.name,
			display_name: values.display_name.trim(),
			description: values.description?.trim(),
		});
	};

	return (
		<Modal
			open={open}
			title={editingPermission ? `Edit Permission: ${editingPermission.name}` : 'Create New Permission'}
			confirmLoading={submitting}
			onOk={handleOk}
			onCancel={onCancel}
			destroyOnClose
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Form.Item name="module" label="Target Module" rules={[{ required: true, message: 'Please select a module' }]}>
					<Select placeholder="Select module" options={moduleOptions} disabled={Boolean(editingPermission)} />
				</Form.Item>

				{!editingPermission && (
					<Form.Item
						name="action"
						label="Permission Action"
						rules={[
							{ required: true, message: 'Please enter permission action' },
							{ pattern: /^[a-z0-9_-]+$/, message: 'Only lowercase letters, numbers, hyphens, and underscores' },
							{ min: 2, message: 'Action must be at least 2 characters' },
							{ max: 50, message: 'Action cannot exceed 50 characters' },
						]}
					>
						<Input placeholder="e.g. export" addonBefore={`${selectedModule || 'module'}.`} />
					</Form.Item>
				)}

				<Form.Item
					name="name"
					label="Permission Slug (System Identifier)"
					tooltip="Auto-generated full identifier used for permission checks"
					rules={[
						{ required: true, message: 'Permission slug is required' },
						{ pattern: /^[a-z0-9_-]+\.[a-z0-9_-]+$/, message: 'Must match module.action format' },
					]}
				>
					<Input
						placeholder="Auto-generated e.g. venue.export"
						disabled
						prefix={<KeyOutlined style={{ color: '#1890ff' }} />}
						style={{ backgroundColor: '#f9f9f9', color: '#1890ff', fontWeight: 600 }}
					/>
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
					<Input placeholder="e.g. Export Venues" />
				</Form.Item>

				<Form.Item name="description" label="Description" rules={[{ max: 255, message: 'Description cannot exceed 255 characters' }]}>
					<Input.TextArea placeholder="Describe the capabilities granted by this permission" rows={3} />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default PermissionFormModal;
