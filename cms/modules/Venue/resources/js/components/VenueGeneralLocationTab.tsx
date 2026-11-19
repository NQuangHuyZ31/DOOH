import React from 'react';
import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

interface VenueGeneralLocationTabProps {
	venueTypeOptions: Array<{ label: string; value: string }>;
	generating: boolean;
	onAutoGenerateCode: () => void;
}

export const VenueGeneralLocationTab: React.FC<VenueGeneralLocationTabProps> = ({ venueTypeOptions, generating, onAutoGenerateCode }) => {
	return (
		<>
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
					<Button icon={<ThunderboltOutlined />} onClick={onAutoGenerateCode} loading={generating} title="Auto generate standard code">
						Auto Code
					</Button>
				</Space.Compact>
			</Form.Item>

			<Form.Item name="address" label="Street Address">
				<Input placeholder="e.g. 720A Dien Bien Phu" />
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
				<Form.Item name="latitude" label="Latitude (GPS)">
					<InputNumber style={{ width: '100%' }} step={0.000001} min={-90} max={90} placeholder="e.g. 10.795200" />
				</Form.Item>
				<Form.Item name="longitude" label="Longitude (GPS)">
					<InputNumber style={{ width: '100%' }} step={0.000001} min={-180} max={180} placeholder="e.g. 106.721800" />
				</Form.Item>
			</div>

			<Form.Item name="daily_traffic" label="Daily Traffic (Est. OTS)">
				<InputNumber style={{ width: '100%' }} min={0} placeholder="85000" />
			</Form.Item>
		</>
	);
};

export default VenueGeneralLocationTab;
