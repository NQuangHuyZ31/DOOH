import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { CustomModal } from '@core/components/CustomModal';
import { useAppSelector } from '@core/store/hooks';
import { venueApi } from '../Action/venueApi';
import type { VenueItem } from '../types/venue';

interface VenueFormModalProps {
	open: boolean;
	initialValues?: VenueItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<VenueItem>) => Promise<void>;
}

export const VenueFormModal: React.FC<VenueFormModalProps> = ({ open, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const [generating, setGenerating] = useState(false);
	const metadata = useAppSelector((state) => state.metadata.data);
	const venueTypeOptions = metadata?.enums?.venue_types || [];
	const statusOptions = metadata?.statuses?.venue || [];

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue(initialValues);
			} else {
				form.resetFields();
				form.setFieldsValue({
					venue_type: 'shopping_mall',
					country_code: 'VN',
					status: 'active',
				});
			}
		}
	}, [open, initialValues, form]);

	const handleAutoGenerateCode = async () => {
		const city = form.getFieldValue('city_province');
		const name = form.getFieldValue('name');
		if (!name) {
			message.warning('Please enter venue name first to generate code.');
			return;
		}
		setGenerating(true);
		try {
			const res = await venueApi.generateVenueCode(city, name);
			if (res.data?.data?.code) {
				form.setFieldValue('code', res.data.data.code);
				message.success(`Generated code: ${res.data.data.code}`);
			}
		} finally {
			setGenerating(false);
		}
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			await onSubmit(values);
		} catch {
			// Form validation failure
		}
	};

	return (
		<CustomModal open={open} title={initialValues ? 'Edit Venue Location' : 'Create New Venue Location'} onOk={handleOk} onCancel={onCancel} confirmLoading={loading} width={640}>
			<Form form={form} layout="vertical">
				<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
					<Form.Item name="name" label="Venue Name" rules={[{ required: true, message: 'Please enter venue name' }]}>
						<Input placeholder="e.g. Landmark 81 Mall" />
					</Form.Item>
					<Form.Item name="venue_type" label="Environment Type">
						<Select options={venueTypeOptions} />
					</Form.Item>
				</div>
				<Form.Item label="Venue Code" required>
					<Space.Compact style={{ width: '100%' }}>
						<Form.Item name="code" noStyle rules={[{ required: true, message: 'Venue code is required' }]}>
							<Input placeholder="e.g. SGN-LM81" style={{ textTransform: 'uppercase' }} />
						</Form.Item>
						<Button icon={<ThunderboltOutlined />} onClick={handleAutoGenerateCode} loading={generating} title="Auto generate standard code">
							Auto Code
						</Button>
					</Space.Compact>
				</Form.Item>
				<Form.Item name="address" label="Street Address">
					<Input placeholder="e.g. 720A Dien Bien Phu, Ward 22" />
				</Form.Item>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<Form.Item name="city_province" label="City / Province">
						<Input placeholder="e.g. Ho Chi Minh City" />
					</Form.Item>
					<Form.Item name="district" label="District">
						<Input placeholder="e.g. Binh Thanh" />
					</Form.Item>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<Form.Item name="daily_traffic" label="Daily Traffic (Est. OTS)">
						<InputNumber style={{ width: '100%' }} min={0} placeholder="85000" />
					</Form.Item>
					<Form.Item name="status" label="Status">
						<Select options={statusOptions} />
					</Form.Item>
				</div>
			</Form>
		</CustomModal>
	);
};

export default VenueFormModal;
