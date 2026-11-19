import React from 'react';
import { Form, Input, Select, Switch, TimePicker } from 'antd';

interface VenueOperationsTabProps {
	is247: boolean;
	statusOptions: Array<{ label: string; value: string }>;
	isSuperAdminOrAdmin: boolean;
	mediaOwners: Array<{ id: number; name: string; email: string }>;
}

export const VenueOperationsTab: React.FC<VenueOperationsTabProps> = ({ is247, statusOptions, isSuperAdminOrAdmin, mediaOwners }) => {
	return (
		<>
			<Form.Item name="is_24_7" label="Continuous 24/7 Playback" valuePropName="checked" style={{ marginBottom: 12 }}>
				<Switch checkedChildren="24/7 Active" unCheckedChildren="Custom Hours" />
			</Form.Item>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item name="opening_time" label="Opening Time (Display On)">
					<TimePicker format="HH:mm" style={{ width: '100%' }} disabled={is247} placeholder="06:00" />
				</Form.Item>
				<Form.Item name="closing_time" label="Closing Time (Display Off)">
					<TimePicker format="HH:mm" style={{ width: '100%' }} disabled={is247} placeholder="23:00" />
				</Form.Item>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
				<Form.Item name="contact_name" label="On-site Contact Person">
					<Input placeholder="e.g. Nguyen Van A" />
				</Form.Item>
				<Form.Item name="contact_phone" label="Contact Phone Number">
					<Input placeholder="e.g. 0901234567" />
				</Form.Item>
			</div>

			<Form.Item name="status" label="Status">
				<Select options={statusOptions} />
			</Form.Item>

			{isSuperAdminOrAdmin && (
				<Form.Item name="media_owner_id" label="Media Owner / Asset Partner">
					<Select
						allowClear
						placeholder="Select Media Owner"
						options={mediaOwners.map((owner) => ({
							value: owner.id,
							label: `${owner.name} (${owner.email})`,
						}))}
					/>
				</Form.Item>
			)}
		</>
	);
};

export default VenueOperationsTab;
