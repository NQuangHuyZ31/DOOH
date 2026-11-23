import React, { useEffect, useState } from 'react';
import { Form, Tabs, message } from 'antd';
import { CustomModal } from '@core/components/CustomModal';
import { useAppSelector } from '@core/store/hooks';
import { venueApi } from '../Action/venueApi';
import type { ScreenItem, VenueItem } from '../types/venue';
import { ScreenGeneralPlaybackTab } from './ScreenGeneralPlaybackTab';
import { ScreenPhysicalSpecsTab } from './ScreenPhysicalSpecsTab';

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
	const resolutionPresets = metadata?.enums?.resolution_presets || [];

	const width = Form.useWatch('resolution_width', form) || 1920;
	const height = Form.useWatch('resolution_height', form) || 1080;

	useEffect(() => {
		if (open) {
			if (initialValues) {
				form.setFieldsValue({ ...initialValues, has_audio: Boolean(initialValues.has_audio) });
			} else {
				form.resetFields();
				form.setFieldsValue({
					venue_id: venues[0]?.id, screen_type: 'outdoor_led', resolution_width: 1920, resolution_height: 1080,
					loop_duration_seconds: 120, default_slot_seconds: 15, has_audio: false, status: 'active',
				});
			}
		}
	}, [open, initialValues, venues, form]);

	const handleAutoGenerateCode = async () => {
		const venueId = form.getFieldValue('venue_id');
		const venue = venues.find((v) => v.id === venueId);
		if (!venue) return message.warning('Please select a venue first.');
		setGenerating(true);
		try {
			const res = await venueApi.generateScreenCode(venue.code);
			if (res.data?.data?.code) {
				form.setFieldValue('code', res.data.data.code);
				message.success(`Generated: ${res.data.data.code}`);
			}
		} finally { setGenerating(false); }
	};

	const applyResolutionPreset = (presetVal: string) => {
		const found = resolutionPresets.find((p: any) => p.value === presetVal);
		if (found?.width && found?.height) {
			form.setFieldsValue({ resolution_width: found.width, resolution_height: found.height });
		} else {
			if (presetVal === '1080p_land') form.setFieldsValue({ resolution_width: 1920, resolution_height: 1080 });
			if (presetVal === '1080p_port') form.setFieldsValue({ resolution_width: 1080, resolution_height: 1920 });
			if (presetVal === '4k_land') form.setFieldsValue({ resolution_width: 3840, resolution_height: 2160 });
			if (presetVal === '4k_port') form.setFieldsValue({ resolution_width: 2160, resolution_height: 3840 });
		}
	};

	const handleOk = async () => {
		try {
			const values = await form.validateFields();
			await onSubmit(values);
		} catch { /* Validation failure */ }
	};

	return (
		<CustomModal open={open} title={initialValues ? 'Edit Screen Device' : 'Register New Screen Device'} onOk={handleOk} onCancel={onCancel} confirmLoading={loading} width={680}>
			<Form form={form} layout="vertical">
				<Tabs
					defaultActiveKey="general"
					items={[
						{
							key: 'general', label: 'General & Playback',
							children: (
								<ScreenGeneralPlaybackTab
									venues={venues} screenTypeOptions={screenTypeOptions} statusOptions={statusOptions} resolutionPresets={resolutionPresets}
									generating={generating} onAutoGenerateCode={handleAutoGenerateCode} onPresetChange={applyResolutionPreset}
									width={Number(width)} height={Number(height)}
								/>
							),
						},
						{ key: 'specs', label: 'Hardware & Physical Specs', children: <ScreenPhysicalSpecsTab /> },
					]}
				/>
			</Form>
		</CustomModal>
	);
};

export default ScreenFormModal;
