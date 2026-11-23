import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, Radio, Row, Col, Select, Card, type FormInstance } from 'antd';
import { UserOutlined, PlusOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { fetchUsers } from '@modules/User/resources/js/store/userThunk';

type AccountMode = 'none' | 'create' | 'link';

interface VendorUserAccountFieldsProps {
	form: FormInstance;
	open: boolean;
	initialUser?: { id: number; name: string; email: string } | null;
}

export const VendorUserAccountFields: React.FC<VendorUserAccountFieldsProps> = ({ form, open, initialUser }) => {
	const [mode, setMode] = useState<AccountMode>('none');
	const dispatch = useAppDispatch();
	const users = useAppSelector((state) => state.user?.users || []);
	const loading = useAppSelector((state) => state.user?.loading || false);

	useEffect(() => {
		if (open) {
			if (initialUser?.id) {
				setMode('link');
				form.setFieldsValue({ create_user: false, user_id: initialUser.id });
			} else {
				setMode('none');
				form.setFieldsValue({ create_user: false, user_id: undefined });
			}
		}
	}, [open, initialUser, form]);

	useEffect(() => {
		if (mode === 'link' && users.length === 0) {
			dispatch(fetchUsers({ role: 'media_owner', per_page: 100 }));
		}
	}, [mode, users.length, dispatch]);

	const userOptions = useMemo(() => {
		const isMediaOwner = (r: unknown) => (typeof r === 'string' ? r === 'media_owner' : (r as { name?: string })?.name === 'media_owner');
		const mediaOwners = users.filter((u) => isMediaOwner(u.role));
		const options = mediaOwners.map((u) => ({
			label: `${u.name} (${u.email})${u.vendor ? ` [Linked: ${u.vendor.name}]` : ''}`,
			value: u.id,
		}));
		if (initialUser?.id && !options.some((o) => o.value === initialUser.id)) {
			options.unshift({ label: `${initialUser.name} (${initialUser.email})`, value: initialUser.id });
		}
		return options;
	}, [users, initialUser]);

	const handleModeChange = (newMode: AccountMode) => {
		setMode(newMode);
		if (newMode === 'create') {
			form.setFieldsValue({
				create_user: true,
				user_id: undefined,
				user_name: form.getFieldValue('user_name') || form.getFieldValue('contact_name') || form.getFieldValue('name') || '',
				user_email: form.getFieldValue('user_email') || form.getFieldValue('contact_email') || '',
			});
		} else if (newMode === 'link') {
			form.setFieldsValue({ create_user: false, user_id: initialUser?.id || undefined });
		} else {
			form.setFieldsValue({ create_user: false, user_id: null });
		}
	};

	return (
		<Card size="small" style={{ marginBottom: 16, background: '#fafafa' }} title="Portal Account Linking (Role: Media Owner)">
			<Form.Item name="create_user" hidden><Input /></Form.Item>
			<Radio.Group value={mode} onChange={(e) => handleModeChange(e.target.value)} style={{ marginBottom: 16 }}>
				<Radio value="none"><DisconnectOutlined /> No User Account</Radio>
				<Radio value="create"><PlusOutlined /> Create New User</Radio>
				<Radio value="link"><LinkOutlined /> Link Existing User</Radio>
			</Radio.Group>

			{mode === 'link' && (
				<Form.Item name="user_id" label="Select Existing Media Owner" rules={[{ required: true, message: 'Please select a user to link' }]}>
					<Select
						placeholder="Search and select Media Owner account"
						options={userOptions}
						loading={loading}
						showSearch
						filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
						allowClear
					/>
				</Form.Item>
			)}

			{mode === 'create' && (
				<Row gutter={16}>
					<Col span={8}>
						<Form.Item name="user_name" label="Login Name" rules={[{ required: true, message: 'User name is required' }]}>
							<Input prefix={<UserOutlined />} placeholder="Full Name" />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="user_email" label="Login Email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email' }]}>
							<Input placeholder="user@company.com" />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="user_password" label="Initial Password" rules={[{ required: true, message: 'Password is required' }, { min: 6, message: 'Min 6 chars' }]}>
							<Input.Password placeholder="Min 6 characters" />
						</Form.Item>
					</Col>
				</Row>
			)}
		</Card>
	);
};

export default VendorUserAccountFields;
