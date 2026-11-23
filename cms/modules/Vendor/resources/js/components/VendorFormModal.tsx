import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';
import { CustomModal } from '@core/components/CustomModal';
import type { VendorItem } from '../types/vendor';

interface VendorFormModalProps {
	open: boolean;
	initialValues?: VendorItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<VendorItem>) => Promise<void>;
}

export const VendorFormModal: React.FC<VendorFormModalProps> = ({ open, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const isEdit = Boolean(initialValues?.id);

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue(initialValues);
			} else {
				form.resetFields();
				form.setFieldsValue({
					rate_limit_per_minute: 120,
					revenue_share_percentage: 70.0,
					status: 'active',
				});
			}
		}
	}, [open, initialValues, form]);

	const handleOk = async () => {
		const values = await form.validateFields();
		await onSubmit(values);
	};

	return (
		<CustomModal
			open={open}
			title={isEdit ? 'Edit Vendor / Media Owner' : 'Add New Vendor / Media Owner'}
			onCancel={onCancel}
			onOk={handleOk}
			confirmLoading={loading}
			width={680}
		>
			<Form form={form} layout="vertical">
				<Row gutter={16}>
					<Col span={10}>
						<Form.Item name="code" label="Vendor Code" tooltip="Leave blank to auto-generate (e.g. VND-GOLDSUN)">
							<Input placeholder="Auto-generated" />
						</Form.Item>
					</Col>
					<Col span={14}>
						<Form.Item name="name" label="Display Name" rules={[{ required: true, message: 'Vendor name is required' }]}>
							<Input placeholder="e.g. Goldsun Focus Media" />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={14}>
						<Form.Item name="company_name" label="Legal Company Name">
							<Input placeholder="e.g. Goldsun Focus Media JSC" />
						</Form.Item>
					</Col>
					<Col span={10}>
						<Form.Item name="tax_code" label="Tax Code">
							<Input placeholder="e.g. 0102030405" />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={8}>
						<Form.Item name="contact_name" label="Contact Person">
							<Input placeholder="Full name" />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="contact_phone" label="Phone Number">
							<Input placeholder="0912..." />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="contact_email" label="Email" rules={[{ type: 'email', message: 'Invalid email' }]}>
							<Input placeholder="partner@..." />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item name="address" label="Headquarters Address">
					<Input placeholder="Street, District, City" />
				</Form.Item>

				<Row gutter={16}>
					<Col span={8}>
						<Form.Item name="revenue_share_percentage" label="Rev Share (%)" rules={[{ required: true }]}>
							<InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="rate_limit_per_minute" label="Rate Limit (req/min)" rules={[{ required: true }]}>
							<InputNumber min={10} max={3600} step={10} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="status" label="Status" rules={[{ required: true }]}>
							<Select options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Suspended', value: 'suspended' }]} />
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</CustomModal>
	);
};

export default VendorFormModal;
