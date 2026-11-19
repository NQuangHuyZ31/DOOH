import React from 'react';
import { Form, Input, InputNumber } from 'antd';

export const ScreenPhysicalSpecsTab: React.FC = () => {
	return (
		<>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item name="physical_width_m" label="Physical Width (meters)">
					<InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="e.g. 12.0" />
				</Form.Item>
				<Form.Item name="physical_height_m" label="Physical Height (meters)">
					<InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="e.g. 6.0" />
				</Form.Item>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item name="pixel_pitch_mm" label="Pixel Pitch (mm)">
					<InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="e.g. 3.9 for P3.9" />
				</Form.Item>
				<Form.Item name="brightness_nits" label="Brightness (nits)">
					<InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 6500" />
				</Form.Item>
			</div>

			<Form.Item name="hardware_device_uid" label="Hardware Device UID / MAC / Box Serial">
				<Input placeholder="e.g. D0:B5:C2:AA:11:22 or ANDROID-SN-998822" />
			</Form.Item>
		</>
	);
};

export default ScreenPhysicalSpecsTab;
