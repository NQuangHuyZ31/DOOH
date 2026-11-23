import React, { useMemo } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Row, Col } from 'antd';
import type { FormInstance } from 'antd';
import type { VenueItem, ScreenItem } from '@modules/Venue/resources/js/types/venue';
import type { CampaignItem } from '../types/delivery';
import { LINE_ITEM_STATUS_OPTIONS, PACING_MODE_OPTIONS } from '../configs/deliveryFilterConfigs';

interface LineItemFormFieldsProps {
	form: FormInstance;
	campaigns: CampaignItem[];
	venues: VenueItem[];
	screens: ScreenItem[];
	currentOrientation: string;
	orientationOptions: Array<{ label: string; value: string }>;
	onOrientationChange: (val: string) => void;
}

export const LineItemFormFields: React.FC<LineItemFormFieldsProps> = ({ campaigns, venues, screens, currentOrientation, orientationOptions, onOrientationChange }) => {
	const campaignOptions = useMemo(() => campaigns.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id })), [campaigns]);

	const screenGroupOptions = useMemo(() => {
		const byVenue: Record<number, { venueName: string; screens: ScreenItem[] }> = {};
		venues.forEach((v) => { byVenue[v.id] = { venueName: v.name, screens: [] }; });
		screens.forEach((s) => {
			if (!byVenue[s.venue_id]) {
				const v = venues.find((x) => x.id === s.venue_id);
				byVenue[s.venue_id] = { venueName: v ? v.name : `Venue #${s.venue_id}`, screens: [] };
			}
			byVenue[s.venue_id].screens.push(s);
		});
		return Object.values(byVenue).filter((g) => g.screens.length > 0).map((g) => ({
			label: g.venueName,
			options: g.screens.map((s) => ({
				label: `${s.name} (${s.resolution_width}×${s.resolution_height} - ${s.orientation.toUpperCase()})`,
				value: s.id,
				disabled: currentOrientation !== 'custom' && s.orientation !== currentOrientation && s.orientation !== 'custom',
			})),
		}));
	}, [venues, screens, currentOrientation]);

	return (
		<>
			<Row gutter={16}>
				<Col span={7}>
					<Form.Item name="campaign_id" label="Campaign" rules={[{ required: true, message: 'Please select a campaign' }]}>
						<Select placeholder="Select Campaign" options={campaignOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
					</Form.Item>
				</Col>
				<Col span={7}>
					<Form.Item name="name" label="Line Item Name" rules={[{ required: true, message: 'Name is required' }]}>
						<Input placeholder="e.g. Landmark Prime Video Loop" />
					</Form.Item>
				</Col>
				<Col span={4}>
					<Form.Item name="orientation" label="Orientation" rules={[{ required: true }]}>
						<Select onChange={onOrientationChange} options={orientationOptions} />
					</Form.Item>
				</Col>
				<Col span={3}>
					<Form.Item name="priority" label="Priority (1-10)" rules={[{ required: true }]}>
						<InputNumber min={1} max={10} style={{ width: '100%' }} />
					</Form.Item>
				</Col>
				<Col span={3}>
					<Form.Item name="pacing_mode" label="Pacing" rules={[{ required: true }]}>
						<Select options={PACING_MODE_OPTIONS} />
					</Form.Item>
				</Col>
			</Row>
			<Row gutter={16}>
				<Col span={6}>
					<Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
						<DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
					</Form.Item>
				</Col>
				<Col span={6}>
					<Form.Item name="end_date" label="End Date" rules={[{ required: true }]}>
						<DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
					</Form.Item>
				</Col>
				<Col span={4}>
					<Form.Item name="daily_impression_cap" label="Daily Cap (imps)" rules={[{ required: true }]}>
						<InputNumber min={1} step={500} style={{ width: '100%' }} />
					</Form.Item>
				</Col>
				<Col span={4}>
					<Form.Item name="target_impressions" label="Total Cap (Lifetime)" rules={[{ required: true }]}>
						<InputNumber min={1} step={1000} style={{ width: '100%' }} />
					</Form.Item>
				</Col>
				<Col span={4}>
					<Form.Item name="status" label="Status" rules={[{ required: true }]}>
						<Select options={LINE_ITEM_STATUS_OPTIONS} />
					</Form.Item>
				</Col>
			</Row>
			<Form.Item name="screen_ids" label="Target Screens (Grouped by Venue - Incompatible screens disabled)" rules={[{ required: true, message: 'Please select target screens' }]}>
				<Select mode="multiple" placeholder="Select Target Screens" allowClear options={screenGroupOptions} maxTagCount="responsive" />
			</Form.Item>
		</>
	);
};

export default LineItemFormFields;
