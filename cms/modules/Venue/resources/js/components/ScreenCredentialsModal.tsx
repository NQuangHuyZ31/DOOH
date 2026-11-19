import React, { useState } from 'react';
import { Button, Space, Typography, message } from 'antd';
import { CopyOutlined, KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import { CustomModal } from '@core/components/CustomModal';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { regenerateScreenKey } from '../store/venueThunk';

const { Text, Paragraph } = Typography;

export interface ScreenCredentialsModalProps {
	open: boolean;
	screenId: number | null;
	onClose: () => void;
}

export const ScreenCredentialsModal: React.FC<ScreenCredentialsModalProps> = ({ open, screenId, onClose }) => {
	const dispatch = useAppDispatch();
	const screens = useAppSelector((state) => state.venue.screens);
	const screen = screens.find((s) => s.id === screenId);
	const [regenerating, setRegenerating] = useState(false);

	const handleRegenerate = async () => {
		if (!screen) return;
		try {
			setRegenerating(true);
			await dispatch(regenerateScreenKey(screen.id)).unwrap();
			message.success('HMAC Secret Key regenerated successfully.');
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to regenerate secret key.'));
		} finally {
			setRegenerating(false);
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		message.success(`Copied ${label} to clipboard.`);
	};

	return (
		<CustomModal
			open={open}
			title={
				<Space>
					<KeyOutlined style={{ color: '#1677ff' }} />
					<span>Edge Player Credentials: {screen?.code || 'Screen'}</span>
				</Space>
			}
			onCancel={onClose}
			footer={[
				<Button key="close" type="primary" onClick={onClose}>
					Close
				</Button>,
			]}
			width={540}
		>
			<Paragraph type="secondary">Enter these configuration details in the DOOH Edge Player app to activate telemetry and HMAC beacon signing:</Paragraph>

			<div style={{ background: '#f5f5f5', padding: 16, borderRadius: 6, marginBottom: 16 }}>
				<div style={{ marginBottom: 12 }}>
					<Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
						SCREEN CODE
					</Text>
					<Space style={{ width: '100%', justifyContent: 'space-between' }}>
						<Text strong code style={{ fontSize: 14 }}>
							{screen?.code || 'N/A'}
						</Text>
						{screen?.code && (
							<Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(screen.code, 'Screen Code')}>
								Copy
							</Button>
						)}
					</Space>
				</div>

				<div>
					<Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
						HMAC SECRET KEY
					</Text>
					<Space style={{ width: '100%', justifyContent: 'space-between' }}>
						<Text code copyable={false} style={{ fontSize: 13, wordBreak: 'break-all' }}>
							{screen?.secret_key || 'No key generated'}
						</Text>
						{screen?.secret_key && (
							<Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(screen.secret_key!, 'Secret Key')}>
								Copy
							</Button>
						)}
					</Space>
				</div>
			</div>

			<Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
				<Text type="danger" style={{ fontSize: 12 }}>
					Generating a new key will immediately disconnect any active Edge Player using the previous key.
				</Text>
				<Button danger icon={<ReloadOutlined />} loading={regenerating} onClick={handleRegenerate}>
					Regenerate Key
				</Button>
			</Space>
		</CustomModal>
	);
};

export default ScreenCredentialsModal;
