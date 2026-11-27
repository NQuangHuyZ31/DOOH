import React, { useEffect } from 'react';
import { Col, Form, Input, InputNumber, Modal, Row, Select, Switch, TimePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useAppSelector } from '@core/store/hooks';
import type { CreateLocalScreenPayload } from '../types/simulator';

interface LocalScreenFormValues extends Omit<CreateLocalScreenPayload, 'opening_time' | 'closing_time'> {
	opening_time?: Dayjs;
	closing_time?: Dayjs;
}

interface LocalScreenFormModalProps {
	open: boolean;
	loading: boolean;
	onCancel: () => void;
	onSubmit: (values: CreateLocalScreenPayload) => void;
}

export const LocalScreenFormModal: React.FC<LocalScreenFormModalProps> = ({ open, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm<LocalScreenFormValues>();
	const screenTypeOptions = useAppSelector((state) => state.metadata.data?.enums?.screen_types) || [];
	const is247 = Form.useWatch('is_24_7', form);

	useEffect(() => {
		if (open) {
			form.resetFields();
			form.setFieldsValue({
				screen_type: screenTypeOptions[0]?.value || 'outdoor_led',
				resolution_width: 1920,
				resolution_height: 1080,
				has_audio: false,
				loop_duration_seconds: 120,
				default_slot_seconds: 15,
				is_24_7: false,
				opening_time: dayjs('06:00:00', 'HH:mm:ss'),
				closing_time: dayjs('23:00:00', 'HH:mm:ss'),
			});
		}
	}, [open, form]);

	const handleOk = async () => {
		const values = await form.validateFields();
		onSubmit({
			...values,
			opening_time: values.is_24_7 ? '00:00:00' : values.opening_time?.format('HH:mm:ss') || '06:00:00',
			closing_time: values.is_24_7 ? '23:59:59' : values.closing_time?.format('HH:mm:ss') || '23:00:00',
		});
	};

	return (
		<Modal open={open} title="Add Partner Local Screen" okText="Save Local Screen" confirmLoading={loading} onCancel={onCancel} onOk={handleOk} width={640} destroyOnHidden>
			<Form form={form} layout="vertical">
				<Row gutter={12}>
					<Col span={14}>
						<Form.Item name="name" label="Screen Name" rules={[{ required: true, message: 'Screen name is required' }]}>
							<Input placeholder="e.g. Landmark 81 - Lobby LED 01" />
						</Form.Item>
					</Col>
					<Col span={10}>
						<Form.Item name="screen_type" label="Screen Type">
							<Select options={screenTypeOptions} />
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
					<Col span={8}>
						<Form.Item name="is_24_7" label="24/7 Playback" valuePropName="checked">
							<Switch />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="opening_time" label="Opening Time">
							<TimePicker format="HH:mm" disabled={Boolean(is247)} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item name="closing_time" label="Closing Time">
							<TimePicker format="HH:mm" disabled={Boolean(is247)} style={{ width: '100%' }} />
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
