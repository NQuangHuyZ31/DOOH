import React from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Switch, Tag } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { VenueItem } from '../types/venue';

interface ScreenGeneralPlaybackTabProps {
	venues: VenueItem[];
	screenTypeOptions: Array<{ label: string; value: string }>;
	statusOptions: Array<{ label: string; value: string }>;
	generating: boolean;
	onAutoGenerateCode: () => void;
	onPresetChange: (preset: string) => void;
	width?: number;
	height?: number;
}

export const ScreenGeneralPlaybackTab: React.FC<ScreenGeneralPlaybackTabProps> = ({ venues, screenTypeOptions, statusOptions, generating, onAutoGenerateCode, onPresetChange, width = 1920, height = 1080 }) => {
	const orientation = width >= height ? 'Landscape' : 'Portrait';

	return (
		<>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item name="venue_id" label="Assigned Venue" rules={[{ required: true, message: 'Please select a venue' }]}>
					<Select options={venues.map((v) => ({ value: v.id, label: `${v.name} (${v.code})` }))} />
				</Form.Item>
				<Form.Item name="name" label="Screen Name" rules={[{ required: true, message: 'Please enter screen name' }]}>
					<Input placeholder="e.g. Entrance Curved LED" />
				</Form.Item>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item label="Screen Code" required>
					<Space.Compact style={{ width: '100%' }}>
						<Form.Item name="code" noStyle rules={[{ required: true, message: 'Screen code is required' }]}>
							<Input placeholder="e.g. SCR-SGN-LM81-01" style={{ textTransform: 'uppercase' }} />
						</Form.Item>
						<Button icon={<ThunderboltOutlined />} onClick={onAutoGenerateCode} loading={generating} title="Auto generate code">
							Auto
						</Button>
					</Space.Compact>
				</Form.Item>
				<Form.Item name="screen_type" label="Hardware Type">
					<Select options={screenTypeOptions} />
				</Form.Item>
			</div>

			<Form.Item name="sub_location" label="Sub-location / Physical Placement">
				<Input placeholder="e.g. Level 1 Main Atrium, Gate 3 International Terminal" />
			</Form.Item>

			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
				<Form.Item label="Resolution Presets">
					<Select
						placeholder="Select Preset"
						onChange={onPresetChange}
						options={[
							{ value: '1080p_land', label: '1920 × 1080 (16:9 Landscape)' },
							{ value: '1080p_port', label: '1080 × 1920 (9:16 Portrait)' },
							{ value: '4k_land', label: '3840 × 2160 (4K Landscape)' },
							{ value: '4k_port', label: '2160 × 3840 (4K Portrait)' },
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

			<div style={{ marginBottom: 12, marginTop: -8 }}>
				<Tag color="blue">{`${width} × ${height} (${orientation})`}</Tag>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
				<Form.Item name="loop_duration_seconds" label="Loop Duration (s)">
					<InputNumber style={{ width: '100%' }} min={10} max={3600} />
				</Form.Item>
				<Form.Item name="default_slot_seconds" label="Slot Duration (s)">
					<InputNumber style={{ width: '100%' }} min={5} max={300} />
				</Form.Item>
				<Form.Item name="status" label="Status">
					<Select options={statusOptions} />
				</Form.Item>
			</div>

			<Form.Item name="has_audio" label="Audio Playback Support" valuePropName="checked">
				<Switch checkedChildren="Audio Enabled" unCheckedChildren="Muted (Silent)" />
			</Form.Item>
		</>
	);
};

export default ScreenGeneralPlaybackTab;
