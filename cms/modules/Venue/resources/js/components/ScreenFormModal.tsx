import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { CustomModal } from '@core/components/CustomModal';
import { useAppSelector } from '@core/store/hooks';
import { venueApi } from '../Action/venueApi';
import type { ScreenItem, VenueItem } from '../types/venue';

interface ScreenFormModalProps {
	open: boolean;
	venues: VenueItem[];
	initialValues?: ScreenItem | null;
	loading?: boolean;
	onCancel: () => void;
	onSubmit: (values: Partial<ScreenItem>) => Promise<void>;
}

export const ScreenFormModal: React.FC<ScreenFormModalProps> = ({ open, venues, initialValues, loading, onCancel, onSubmit }) => {
	const [form] = Form.useForm();
	const [generating, setGenerating] = useState(false);
	const metadata = useAppSelector((state) => state.metadata.data);
	const screenTypeOptions = metadata?.enums?.screen_types || [];
	const statusOptions = metadata?.statuses?.venue || [];

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue(initialValues);
			} else {
				form.resetFields();
				form.setFieldsValue({
					venue_id: venues[0]?.id,
					screen_type: 'outdoor_led',
					resolution_width: 1920,
					resolution_height: 1080,
					loop_duration_seconds: 120,
					default_slot_seconds: 15,
					status: 'active',
				});
			}
		}
	}, [open, initialValues, venues, form]);

	const handleAutoGenerateCode = async () => {
		const venueId = form.getFieldValue('venue_id');
		const venue = venues.find((v) => v.id === venueId);
		if (!venue) {
			message.warning('Please select a venue first.');
			return;
		}
		setGenerating(true);
		try {
			const res = await venueApi.generateScreenCode(venue.code);
			if (res.data?.data?.code) {
				form.setFieldValue('code', res.data.data.code);
				message.success(`Generated: ${res.data.data.code}`);
			}
		} finally {
			setGenerating(false);
		}
	};

	const applyResolutionPreset = (preset: string) => {
		if (preset === '1080p_land') form.setFieldsValue({ resolution_width: 1920, resolution_height: 1080 });
		if (preset === '1080p_port') form.setFieldsValue({ resolution_width: 1080, resolution_height: 1920 });
		if (preset === '4k_land') form.setFieldsValue({ resolution_width: 3840, resolution_height: 2160 });
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			await onSubmit(values);
		} catch {
			// Validation failure
		}
	};

	return (
		<CustomModal open={open} title={initialValues ? 'Edit Screen Device' : 'Register New Screen Device'} onOk={handleOk} onCancel={onCancel} confirmLoading={loading} width={680}>
			<Form form={form} layout="vertical">
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<Form.Item name="venue_id" label="Assigned Venue" rules={[{ required: true }]}>
						<Select options={venues.map((v) => ({ value: v.id, label: `${v.name} (${v.code})` }))} />
					</Form.Item>
					<Form.Item name="name" label="Screen Name" rules={[{ required: true }]}>
						<Input placeholder="e.g. Entrance Curved LED" />
					</Form.Item>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<Form.Item label="Screen Code" required>
						<Space.Compact style={{ width: '100%' }}>
							<Form.Item name="code" noStyle rules={[{ required: true }]}>
								<Input placeholder="e.g. SCR-SGN-LM81-01" style={{ textTransform: 'uppercase' }} />
							</Form.Item>
							<Button icon={<ThunderboltOutlined />} onClick={handleAutoGenerateCode} loading={generating}>
								Auto
							</Button>
						</Space.Compact>
					</Form.Item>
					<Form.Item name="screen_type" label="Hardware Type">
						<Select options={screenTypeOptions} />
					</Form.Item>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
					<Form.Item label="Resolution Presets">
						<Select
							placeholder="Select Preset"
							onChange={applyResolutionPreset}
							options={[
								{ value: '1080p_land', label: '1920 × 1080 (16:9 Landscape)' },
								{ value: '1080p_port', label: '1080 × 1920 (9:16 Portrait)' },
								{ value: '4k_land', label: '3840 × 2160 (4K UHD)' },
							]}
						/>
					</Form.Item>
					<Form.Item name="resolution_width" label="Width (px)" rules={[{ required: true }]}>
						<InputNumber style={{ width: '100%' }} min={100} />
					</Form.Item>
					<Form.Item name="resolution_height" label="Height (px)" rules={[{ required: true }]}>
						<InputNumber style={{ width: '100%' }} min={100} />
					</Form.Item>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
					<Form.Item name="loop_duration_seconds" label="Loop Duration (sec)">
						<InputNumber style={{ width: '100%' }} min={10} max={3600} />
					</Form.Item>
					<Form.Item name="default_slot_seconds" label="Slot Duration (sec)">
						<InputNumber style={{ width: '100%' }} min={5} max={300} />
					</Form.Item>
					<Form.Item name="status" label="Status">
						<Select options={statusOptions} />
					</Form.Item>
				</div>
			</Form>
		</CustomModal>
	);
};

export default ScreenFormModal;
