import React, { useEffect } from 'react';
import { Form, Input, Modal, Radio, Select } from 'antd';
import type { RoleItem, UserFormData, UserItem } from '../types/user';

export interface UserFormModalProps {
	open: boolean;
	editingUser: UserItem | null;
	roles: RoleItem[];
	submitting: boolean;
	onCancel: () => void;
	onSubmit: (values: UserFormData) => Promise<void>;
}

const DEFAULT_PERMISSION_OPTIONS = [
	{ label: 'Venue: View', value: 'venue.view' },
	{ label: 'Venue: Create', value: 'venue.create' },
	{ label: 'Venue: Edit', value: 'venue.edit' },
	{ label: 'Creative: View', value: 'creative.view' },
	{ label: 'Creative: Upload', value: 'creative.upload' },
	{ label: 'Delivery: View', value: 'delivery.view' },
	{ label: 'Delivery: Create', value: 'delivery.create' },
	{ label: 'Report: View', value: 'report.view' },
	{ label: 'User: View', value: 'user.view' },
	{ label: 'User: Manage Roles', value: 'user.roles' },
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
	open,
	editingUser,
	roles,
	submitting,
	onCancel,
	onSubmit,
}) => {
	const [form] = Form.useForm<UserFormData>();
	const permType = Form.useWatch('permission_type', form) || 'role';

	useEffect(() => {
		if (open) {
			if (editingUser) {
				const currentType = editingUser.permission_type || 'role';
				form.setFieldsValue({
					name: editingUser.name,
					email: editingUser.email,
					permission_type: currentType,
					role_id:
						editingUser.role_id ??
						(typeof editingUser.role === 'object' ? editingUser.role?.id : undefined),
					direct_permissions: editingUser.direct_permissions ?? editingUser.permissions ?? [],
				});
			} else {
				form.resetFields();
				form.setFieldsValue({
					permission_type: 'role',
					role_id: roles[0]?.id,
				});
			}
		}
	}, [open, editingUser, roles, form]);

	const handleOk = async () => {
		const values = await form.validateFields();
		await onSubmit(values);
	};

	return (
		<Modal
			open={open}
			title={editingUser ? 'Edit User' : 'Add New User'}
			confirmLoading={submitting}
			onOk={handleOk}
			onCancel={onCancel}
			destroyOnClose
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Form.Item
					name="name"
					label="Full Name"
					rules={[{ required: true, message: 'Please enter full name' }]}
				>
					<Input placeholder="e.g. John Doe" />
				</Form.Item>

				<Form.Item
					name="email"
					label="Email Address"
					rules={[
						{ required: true, message: 'Please enter email' },
						{ type: 'email', message: 'Please enter a valid email' },
					]}
				>
					<Input placeholder="e.g. john@example.com" disabled={Boolean(editingUser)} />
				</Form.Item>

				<Form.Item
					name="password"
					label={editingUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
					rules={[{ required: !editingUser, message: 'Please enter password' }]}
				>
					<Input.Password placeholder="••••••••" />
				</Form.Item>

				<Form.Item name="permission_type" label="Permission Mode" rules={[{ required: true }]}>
					<Radio.Group>
						<Radio value="role">Role-based</Radio>
						<Radio value="direct">Direct Permissions</Radio>
					</Radio.Group>
				</Form.Item>

				{permType === 'role' ? (
					<Form.Item
						name="role_id"
						label="Role"
						rules={[{ required: true, message: 'Please select a role' }]}
					>
						<Select
							placeholder="Select a role"
							options={roles.map((r) => ({
								label: r.display_name || r.name,
								value: r.id,
							}))}
						/>
					</Form.Item>
				) : (
					<Form.Item
						name="direct_permissions"
						label="Direct Module Permissions"
						rules={[{ required: true, message: 'Select at least one permission' }]}
					>
						<Select
							mode="multiple"
							placeholder="Select module permissions"
							options={DEFAULT_PERMISSION_OPTIONS}
							allowClear
						/>
					</Form.Item>
				)}
			</Form>
		</Modal>
	);
};

export default UserFormModal;
