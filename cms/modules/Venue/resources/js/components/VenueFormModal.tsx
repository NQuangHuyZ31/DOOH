import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { CustomModal } from '@core';
import type { VenueItem } from '../Action/venueApi';

interface VenueFormModalProps {
	open: boolean;
	initialValues?: VenueItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<VenueItem>) => Promise<void>;
}

export const VenueFormModal: React.FC<VenueFormModalProps> = ({ open, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue(initialValues);
			} else {
				form.resetFields();
				form.setFieldsValue({
					width: 1920,
					height: 1080,
					orientation: 'landscape',
					status: 'active',
				});
			}
		}
	}, [open, initialValues, form]);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			await onSubmit(values);
		} catch {
			// Form validation failed
		}
	};

	return (
		<CustomModal open={open} title={initialValues ? 'Edit Screen Venue' : 'Create New Screen Venue'} onOk={handleOk} onCancel={onCancel} confirmLoading={loading}>
			<Form form={form} layout="vertical">
				<Form.Item name="code" label="Venue Code" rules={[{ required: true, message: 'Please enter a unique venue code (e.g. HN-CG-01)' }]}>
					<Input placeholder="HN-CG-01" disabled={!!initialValues} />
				</Form.Item>

				<Form.Item name="name" label="Screen Name" rules={[{ required: true, message: 'Please enter screen name' }]}>
					<Input placeholder="Landmark 72 LED Billboard" />
				</Form.Item>

				<Form.Item name="location" label="Location / Address" rules={[{ required: true, message: 'Please enter location address' }]}>
					<Input placeholder="Pham Hung, Cau Giay, Hanoi" />
				</Form.Item>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
					<Form.Item name="width" label="Width (px)" rules={[{ required: true }]}>
						<InputNumber style={{ width: '100%' }} min={100} max={7680} />
					</Form.Item>
					<Form.Item name="height" label="Height (px)" rules={[{ required: true }]}>
						<InputNumber style={{ width: '100%' }} min={100} max={4320} />
					</Form.Item>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
					<Form.Item name="orientation" label="Orientation">
						<Select
							options={[
								{ value: 'landscape', label: 'Landscape (16:9)' },
								{ value: 'portrait', label: 'Portrait (9:16)' },
							]}
						/>
					</Form.Item>
					<Form.Item name="status" label="Status">
						<Select
							options={[
								{ value: 'active', label: 'Active' },
								{ value: 'inactive', label: 'Inactive' },
								{ value: 'maintenance', label: 'Maintenance' },
							]}
						/>
					</Form.Item>
				</div>
			</Form>
		</CustomModal>
	);
};

export default VenueFormModal;
