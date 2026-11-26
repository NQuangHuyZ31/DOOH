import React from 'react';
import { Button, Card, Select, Space, Tag, Typography } from 'antd';
import { CloudDownloadOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import type { ScreenItem } from '@modules/Venue/resources/js/types/venue';
import type { SimulatorDeviceConfig } from '../types/simulator';

interface SimulatorToolbarProps {
	screens: ScreenItem[];
	selectedScreenId: number | null;
	deviceConfig: SimulatorDeviceConfig | null;
	syncingDevice: boolean;
	loadingPlaylist: boolean;
	onSelectScreen: (screenId: number) => void;
	onSyncCms: () => void;
	onFetchPlaylist: () => void;
	onOpenCreateModal: () => void;
}

export const SimulatorToolbar: React.FC<SimulatorToolbarProps> = ({ screens, selectedScreenId, deviceConfig, syncingDevice, loadingPlaylist, onSelectScreen, onSyncCms, onFetchPlaylist, onOpenCreateModal }) => (
	<Card size="small">
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
			<Space wrap>
				<Typography.Title level={5} style={{ margin: 0 }}>
					DOOH Edge Player Simulator
				</Typography.Title>
				<Select
					showSearch
					optionFilterProp="label"
					placeholder="Select a physical screen..."
					style={{ width: 300 }}
					value={selectedScreenId}
					onChange={onSelectScreen}
					options={screens.map((s) => ({ value: s.id, label: `${s.name} [${s.code}] — ${s.resolution_width}×${s.resolution_height}` }))}
				/>
				<Button type="primary" icon={<SyncOutlined />} loading={syncingDevice} disabled={!selectedScreenId} onClick={onSyncCms}>
					Sync CMS
				</Button>
				<Button icon={<CloudDownloadOutlined />} loading={loadingPlaylist} disabled={!deviceConfig} onClick={onFetchPlaylist}>
					Fetch Node Playlist
				</Button>
			</Space>
			<Space>
				{deviceConfig && <Tag color="success">Provisioned: {deviceConfig.screen.code}</Tag>}
				<Button icon={<PlusOutlined />} onClick={onOpenCreateModal}>
					Create Screen
				</Button>
			</Space>
		</div>
	</Card>
);

export default SimulatorToolbar;
