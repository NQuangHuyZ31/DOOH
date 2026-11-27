import React from 'react';
import { Button, Card, Empty, List, Popconfirm, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { SimulatorScreenItem } from '../types/simulator';

interface PartnerScreenListProps {
	screens: SimulatorScreenItem[];
	selectedScreenId: number | null;
	syncingScreenId: number | null;
	batchSyncing: boolean;
	loading: boolean;
	onSyncToCms: (screen: SimulatorScreenItem) => void;
	onBatchSyncAll: (unsynced: SimulatorScreenItem[]) => void;
	onLoadPlayer: (screen: SimulatorScreenItem) => void;
	onDelete: (id: number) => void;
}

export const PartnerScreenList: React.FC<PartnerScreenListProps> = ({ screens, selectedScreenId, syncingScreenId, batchSyncing, loading, onSyncToCms, onBatchSyncAll, onLoadPlayer, onDelete }) => {
	const unsyncedScreens = screens.filter((s) => s.sync_status !== 'synced');

	return (
		<Card
			size="small"
			title={`Partner Screen Inventory (${screens.length})`}
			loading={loading}
			extra={
				unsyncedScreens.length > 0 && (
					<Button size="small" type="primary" icon={<SyncOutlined />} loading={batchSyncing} onClick={() => onBatchSyncAll(unsyncedScreens)}>
						{`Sync All Unsynced (${unsyncedScreens.length})`}
					</Button>
				)
			}
			styles={{ body: { padding: 8, maxHeight: 220, overflowY: 'auto' } }}
		>
			{screens.length === 0 ? (
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='Click "Add Local Screen" to register a physical screen, then Sync to CMS' />
			) : (
				<List
					size="small"
					dataSource={screens}
					renderItem={(screen) => {
						const isSynced = screen.sync_status === 'synced';
						const isSelected = screen.id === selectedScreenId;
						return (
							<List.Item
								style={{
									padding: '8px 12px',
									borderRadius: 6,
									background: isSelected ? 'rgba(234, 8, 139, 0.06)' : 'transparent',
								}}
								actions={[
									!isSynced ? (
										<Button key="sync" size="small" type="primary" icon={<SyncOutlined />} loading={syncingScreenId === screen.id} onClick={() => onSyncToCms(screen)}>
											Sync to CMS
										</Button>
									) : (
										<Button key="load" size="small" icon={<PlayCircleOutlined />} onClick={() => onLoadPlayer(screen)}>
											Load Player
										</Button>
									),
									<Popconfirm key="del" title="Remove this simulator screen?" onConfirm={() => onDelete(screen.id)}>
										<Button size="small" danger type="text" icon={<DeleteOutlined />} />
									</Popconfirm>,
								]}
							>
								<Space wrap size={6}>
									<Typography.Text strong>{screen.name}</Typography.Text>
									<Tag color={isSynced ? 'success' : 'warning'}>{isSynced ? 'SYNCED' : 'UNSYNCED'}</Tag>
									{screen.code && <Tag color="magenta">{screen.code}</Tag>}
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{`${screen.resolution_width}×${screen.resolution_height} (${screen.orientation}) • ${screen.location_name}, ${screen.city}`}
									</Typography.Text>
								</Space>
							</List.Item>
						);
					}}
				/>
			)}
		</Card>
	);
};

export default PartnerScreenList;
