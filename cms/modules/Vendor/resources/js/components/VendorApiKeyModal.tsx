import React from 'react';
import { Modal, Typography, Input, Button, Alert, message } from 'antd';
import { CopyOutlined, KeyOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface VendorApiKeyModalProps {
	open: boolean;
	apiKey: string | null;
	onClose: () => void;
}

export const VendorApiKeyModal: React.FC<VendorApiKeyModalProps> = ({ open, apiKey, onClose }) => {
	const handleCopy = async () => {
		if (apiKey) {
			await navigator.clipboard.writeText(apiKey);
			message.success('API Key copied to clipboard!');
		}
	};

	return (
		<Modal
			open={open}
			title={<span><KeyOutlined style={{ color: '#EA088B', marginRight: 8 }} />Partner Ingestion API Key</span>}
			onCancel={onClose}
			footer={[
				<Button key="close" type="primary" onClick={onClose}>
					I Have Stored the Key
				</Button>,
			]}
			destroyOnClose
		>
			<Alert
				type="warning"
				showIcon
				message="Store This Key Securely"
				description="This API key will only be shown once. If you lose it, you will need to regenerate a new key, which will invalidate the previous key."
				style={{ marginBottom: 16 }}
			/>

			<Paragraph>
				Provide this key to the Media Owner technical team to authenticate their Screen Ingestion calls via the header <Text code>X-Partner-Key</Text>.
			</Paragraph>

			<Input.Search
				value={apiKey || ''}
				readOnly
				enterButton={<Button icon={<CopyOutlined />}>Copy</Button>}
				onSearch={handleCopy}
				style={{ marginBottom: 8 }}
			/>
		</Modal>
	);
};

export default VendorApiKeyModal;
