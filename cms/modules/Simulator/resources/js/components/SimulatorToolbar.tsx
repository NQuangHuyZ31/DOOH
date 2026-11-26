import React from 'react';
import { Button, Card, Select, Space, Tag, Typography } from 'antd';
import { CloudDownloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { SimulatorScreenItem } from '../types/simulator';

interface SimulatorToolbarProps {
	syncedScreens: SimulatorScreenItem[];
	selectedScreen: SimulatorScreenItem | null;
	loadingPlaylist: boolean;
	onSelectScreen: (screenId: number) => void;
	onFetchPlaylist: () => void;
	onOpenCreateModal: () => void;
}

export const SimulatorToolbar: React.FC<SimulatorToolbarProps> = ({ syncedScreens, selectedScreen, loadingPlaylist, onSelectScreen, onFetchPlaylist, onOpenCreateModal }) => (
	<Card size="small">
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
			<Space wrap>
				<Typography.Title level={5} style={{ margin: 0 }}>
					DOOH Partner Mini-CMS & Player
				</Typography.Title>
				<Select
					showSearch
					optionFilterProp="label"
					placeholder="Select a synced screen to play..."
					style={{ width: 320 }}
					value={selectedScreen?.id || null}
					onChange={onSelectScreen}
					options={syncedScreens.map((s) => ({ value: s.id, label: `${s.name} [${s.code}] — ${s.resolution_width}×${s.resolution_height}` }))}
				/>
				<Button type="primary" icon={<CloudDownloadOutlined />} loading={loadingPlaylist} disabled={!selectedScreen} onClick={onFetchPlaylist}>
					Fetch Node Playlist
				</Button>
			</Space>
			<Space>
				{selectedScreen?.code && <Tag color="success">Active: {selectedScreen.code}</Tag>}
				<Button icon={<PlusOutlined />} onClick={onOpenCreateModal}>
					Add Local Screen
				</Button>
			</Space>
		</div>
	</Card>
);

export default SimulatorToolbar;
