import React, { useEffect } from 'react';
import { Form, Input, Modal, Tag, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import type { SimulatorScreenItem } from '../types/simulator';

interface SyncApiKeyModalProps {
	open: boolean;
	targets: SimulatorScreenItem[];
	loading: boolean;
	onCancel: () => void;
	onConfirm: (apiKey: string) => void;
}

export const SyncApiKeyModal: React.FC<SyncApiKeyModalProps> = ({ open, targets, loading, onCancel, onConfirm }) => {
	const [form] = Form.useForm<{ partner_api_key: string }>();

	useEffect(() => {
		if (open) {
			form.resetFields();
		}
	}, [open, form]);

	const handleOk = async () => {
		const { partner_api_key } = await form.validateFields();
		onConfirm(partner_api_key.trim());
	};

	const isBatch = targets.length > 1;
	const title = isBatch ? `Batch Sync ${targets.length} Screens to CMS` : `Sync "${targets[0]?.name || ''}" to CMS`;

	return (
		<Modal open={open} title={title} okText="Confirm Sync" confirmLoading={loading} onCancel={onCancel} onOk={handleOk} width={480} destroyOnHidden>
			<Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
				Enter the Partner <Tag color="magenta">X-DOOH-API-KEY</Tag> to register {isBatch ? `these ${targets.length} screens` : 'this screen'} via Node Venue API.
			</Typography.Paragraph>
			<Form form={form} layout="vertical">
				<Form.Item
					name="partner_api_key"
					label="X-DOOH-API-KEY"
					rules={[
						{ required: true, message: 'Please enter a valid X-DOOH-API-KEY' },
						{ min: 8, message: 'API key must be at least 8 characters' },
					]}
				>
					<Input.Password prefix={<KeyOutlined />} placeholder="dooh_live_..." autoFocus />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default SyncApiKeyModal;
