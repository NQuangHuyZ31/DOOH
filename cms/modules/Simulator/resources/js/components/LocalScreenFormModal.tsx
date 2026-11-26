import React, { useEffect } from 'react';
import { Col, Form, Input, InputNumber, Modal, Row, Select, Switch } from 'antd';
import type { CreateLocalScreenPayload } from '../types/simulator';

const SCREEN_TYPES = [
	{ value: 'led', label: 'LED' },
	{ value: 'lcd', label: 'LCD' },
	{ value: 'billboard', label: 'Billboard' },
	{ value: 'kiosk', label: 'Kiosk' },
	{ value: 'elevator', label: 'Elevator' },
	{ value: 'transit', label: 'Transit' },
];

interface LocalScreenFormModalProps {
	open: boolean;
	loading: boolean;
	onCancel: () => void;
	onSubmit: (values: CreateLocalScreenPayload) => void;
}

export const LocalScreenFormModal: React.FC<LocalScreenFormModalProps> = ({ open, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm<CreateLocalScreenPayload>();

	useEffect(() => {
		if (open) {
			form.resetFields();
			form.setFieldsValue({ screen_type: 'led', resolution_width: 1920, resolution_height: 1080, has_audio: false, loop_duration_seconds: 120, default_slot_seconds: 15 });
		}
	}, [open, form]);

	const handleOk = async () => {
		const values = await form.validateFields();
		onSubmit(values);
	};

	return (
		<Modal open={open} title="Add Partner Local Screen" okText="Save Local Screen" confirmLoading={loading} onCancel={onCancel} onOk={handleOk} width={620} destroyOnHidden>
			<Form form={form} layout="vertical">
				<Row gutter={12}>
					<Col span={14}>
						<Form.Item name="name" label="Screen Name" rules={[{ required: true, message: 'Screen name is required' }]}>
							<Input placeholder="e.g. Landmark 81 - Lobby LED 01" />
						</Form.Item>
					</Col>
					<Col span={10}>
						<Form.Item name="screen_type" label="Screen Type">
							<Select options={SCREEN_TYPES} />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={12}>
					<Col span={12}>
						<Form.Item name="location_name" label="Location / Building Name" rules={[{ required: true, message: 'Location name is required' }]}>
							<Input placeholder="e.g. Landmark 81" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="city" label="City / Province" rules={[{ required: true, message: 'City is required' }]}>
							<Input placeholder="e.g. Ho Chi Minh" />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={12}>
					<Col span={12}>
						<Form.Item name="sub_location" label="Sub-location (Optional)">
							<Input placeholder="e.g. Floor 1 - Main Hall" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="hardware_device_uid" label="Hardware Device UID (Optional)">
							<Input placeholder="e.g. HW-LM81-01" />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={12}>
					<Col span={8}>
						<Form.Item name="resolution_width" label="Width (px)" rules={[{ required: true }]}>
							<InputNumber min={100} max={16384} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="resolution_height" label="Height (px)" rules={[{ required: true }]}>
							<InputNumber min={100} max={16384} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="has_audio" label="Audio Support" valuePropName="checked">
							<Switch />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={12}>
					<Col span={12}>
						<Form.Item name="loop_duration_seconds" label="Loop Duration (s)">
							<InputNumber min={10} max={3600} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="default_slot_seconds" label="Default Slot (s)">
							<InputNumber min={3} max={300} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</Modal>
	);
};

export default LocalScreenFormModal;
