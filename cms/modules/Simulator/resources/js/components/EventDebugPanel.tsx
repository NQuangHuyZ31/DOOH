import React from 'react';
import { Button, Card, Descriptions, Empty, List, Space, Tag, Typography } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import type { BeaconLogEntry, SimulatorPlaylistData } from '../types/simulator';

interface EventDebugPanelProps {
	playlistData: SimulatorPlaylistData | null;
	activeIndex: number;
	remainingSeconds: number;
	refreshCountdown: number;
	offlineQueuedCount: number;
	beaconLogs: BeaconLogEntry[];
	onSelectSlot: (idx: number) => void;
	onClearLogs: () => void;
}

const getStatusColor = (status: BeaconLogEntry['statusCode']): string => {
	if (status === 204 || status === 200 || status === 'OK') return 'success';
	if (status === 'OFFLINE') return 'warning';
	return 'error';
};

export const EventDebugPanel: React.FC<EventDebugPanelProps> = ({ playlistData, activeIndex, remainingSeconds, refreshCountdown, offlineQueuedCount, beaconLogs, onSelectSlot, onClearLogs }) => {
	const slots = playlistData?.playlist || [];

	return (
		<Space direction="vertical" size={14} style={{ width: '100%' }}>
			<Card size="small" title="Playback Telemetry">
				{playlistData ? (
					<Descriptions size="small" column={2} bordered>
						<Descriptions.Item label="Source">
							<Tag color="success">Node API Live</Tag>
						</Descriptions.Item>
						<Descriptions.Item label="Screen">{playlistData.screen.code}</Descriptions.Item>
						<Descriptions.Item label="Resolution">{`${playlistData.screen.resolution_width}×${playlistData.screen.resolution_height}`}</Descriptions.Item>
						<Descriptions.Item label="Slots / Loop">{`${playlistData.slots_count} slots (${playlistData.total_duration_seconds}s)`}</Descriptions.Item>
						<Descriptions.Item label="Slot Remaining">{`${remainingSeconds}s`}</Descriptions.Item>
						<Descriptions.Item label="Next Sync">{`${refreshCountdown}s`}</Descriptions.Item>
						{offlineQueuedCount > 0 && (
							<Descriptions.Item label="Offline Queue" span={2}>
								<Tag color="warning">{offlineQueuedCount} beacon(s) pending replay</Tag>
							</Descriptions.Item>
						)}
					</Descriptions>
				) : (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sync a screen playlist to inspect telemetry" />
				)}
			</Card>

			<Card size="small" title={`Playlist Queue (${slots.length})`} styles={{ body: { maxHeight: 200, overflowY: 'auto', padding: 8 } }}>
				{slots.length === 0 ? (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Empty playlist" />
				) : (
					<List
						size="small"
						dataSource={slots}
						renderItem={(slot, idx) => {
							const isCurrent = idx === activeIndex % slots.length;
							return (
								<List.Item
									onClick={() => onSelectSlot(idx)}
									style={{
										cursor: 'pointer',
										padding: '6px 10px',
										borderRadius: 6,
										background: isCurrent ? 'rgba(234, 8, 139, 0.08)' : 'transparent',
										border: isCurrent ? '1px solid rgba(234, 8, 139, 0.35)' : '1px solid transparent',
									}}
								>
									<Space size={6}>
										<Tag color={isCurrent ? 'magenta' : 'default'}>#{idx + 1}</Tag>
										<Typography.Text strong={isCurrent}>{slot.line_item_name || `LineItem #${slot.line_item_id}`}</Typography.Text>
									</Space>
									<Space size={4}>
										<Tag color="purple">{slot.type.toUpperCase()}</Tag>
										<Typography.Text type="secondary">{slot.duration}s</Typography.Text>
									</Space>
								</List.Item>
							);
						}}
					/>
				)}
			</Card>

			<Card
				size="small"
				title={`Live Tracking Beacons (${beaconLogs.length})`}
				extra={
					<Button size="small" type="text" icon={<ClearOutlined />} onClick={onClearLogs}>
						Clear
					</Button>
				}
				styles={{ body: { maxHeight: 240, overflowY: 'auto', padding: 8 } }}
			>
				{beaconLogs.length === 0 ? (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No beacons fired yet" />
				) : (
					<List
						size="small"
						dataSource={beaconLogs}
						renderItem={(log) => (
							<List.Item style={{ padding: '4px 6px' }}>
								<Space size={6} wrap>
									<Typography.Text code style={{ fontSize: 11 }}>
										{log.timestamp}
									</Typography.Text>
									<Tag color="cyan" style={{ margin: 0 }}>
										{log.event}
									</Tag>
									<Tag color={getStatusColor(log.statusCode)} style={{ margin: 0 }}>
										{String(log.statusCode)}
									</Tag>
									<Typography.Text style={{ fontSize: 12 }}>{log.lineItemName || (log.lineItemId ? `LI #${log.lineItemId}` : log.detail || '')}</Typography.Text>
								</Space>
								<Typography.Text type="secondary" style={{ fontSize: 11 }}>
									{log.latencyMs}ms
								</Typography.Text>
							</List.Item>
						)}
					/>
				)}
			</Card>
		</Space>
	);
};

export default EventDebugPanel;
