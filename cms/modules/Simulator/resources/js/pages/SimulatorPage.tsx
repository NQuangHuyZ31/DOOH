import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Space, message } from 'antd';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { createScreen, fetchScreens, fetchVenues } from '@modules/Venue/resources/js/store/venueThunk';
import { ScreenFormModal } from '@modules/Venue/resources/js/components/ScreenFormModal';
import type { ScreenItem } from '@modules/Venue/resources/js/types/venue';
import { fetchNodeDeliveryPlaylist, syncSimulatorDevice } from '../store/simulatorThunk';
import { appendBeaconLog, clearBeaconLogs, setSelectedSimulatorScreen } from '../store/simulatorSlice';
import { usePlayerEngine } from '../hooks/usePlayerEngine';
import { SimulatorToolbar } from '../components/SimulatorToolbar';
import { LedFrameMockup } from '../components/LedFrameMockup';
import { EventDebugPanel } from '../components/EventDebugPanel';
import type { SimulatorDeviceConfig } from '../types/simulator';

const makeNow = (): string => new Date().toLocaleTimeString('en-GB', { hour12: false });

export const SimulatorPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { screens, venues, submitting } = useAppSelector((state) => state.venue);
	const { selectedScreenId, deviceConfig, playlistData, syncingDevice, loadingPlaylist, error, beaconLogs } = useAppSelector((state) => state.simulator);
	const [createModalOpen, setCreateModalOpen] = useState(false);

	useEffect(() => {
		dispatch(fetchScreens({ per_page: 100 }));
		dispatch(fetchVenues({ per_page: 100 }));
	}, [dispatch]);

	const handleFetchNodePlaylist = useCallback(
		async (targetDevice: SimulatorDeviceConfig | null = deviceConfig) => {
			if (!targetDevice) return;
			try {
				const res = await dispatch(fetchNodeDeliveryPlaylist(targetDevice)).unwrap();
				dispatch(appendBeaconLog({ id: `${Date.now()}-pl`, timestamp: makeNow(), event: 'NODE_PLAYLIST', statusCode: res.statusCode, latencyMs: res.latencyMs, detail: `${res.data.slots_count} slot(s)` }));
			} catch (err: unknown) {
				const msg = extractErrorMessage(err, 'Node Delivery API request failed.');
				dispatch(appendBeaconLog({ id: `${Date.now()}-pl-err`, timestamp: makeNow(), event: 'NODE_PLAYLIST', statusCode: 'ERR', latencyMs: 0, detail: msg }));
				message.error(msg);
			}
		},
		[dispatch, deviceConfig],
	);

	const handleSyncWithCms = useCallback(
		async (screenId: number | null = selectedScreenId) => {
			if (!screenId) return;
			const started = performance.now();
			try {
				const synced = await dispatch(syncSimulatorDevice(screenId)).unwrap();
				dispatch(appendBeaconLog({ id: `${Date.now()}-cms`, timestamp: makeNow(), event: 'CMS_SYNC', statusCode: 200, latencyMs: Math.round(performance.now() - started), detail: `Provisioned ${synced.screen.code}` }));
				await handleFetchNodePlaylist(synced);
			} catch (err: unknown) {
				message.error(extractErrorMessage(err, 'Failed to sync device with CMS.'));
			}
		},
		[dispatch, selectedScreenId, handleFetchNodePlaylist],
	);

	const engine = usePlayerEngine(playlistData, () => handleFetchNodePlaylist(deviceConfig));

	const handleCreateScreen = async (values: Partial<ScreenItem>) => {
		try {
			const created = await dispatch(createScreen(values)).unwrap();
			message.success(`Screen "${created.name}" (${created.code}) created.`);
			setCreateModalOpen(false);
			await dispatch(fetchScreens({ per_page: 100 })).unwrap();
			dispatch(setSelectedSimulatorScreen(created.id));
			await handleSyncWithCms(created.id);
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to create screen.'));
		}
	};

	const activeScreen = deviceConfig?.screen || null;

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<SimulatorToolbar
				screens={screens}
				selectedScreenId={selectedScreenId}
				deviceConfig={deviceConfig}
				syncingDevice={syncingDevice}
				loadingPlaylist={loadingPlaylist}
				onSelectScreen={(val) => dispatch(setSelectedSimulatorScreen(val))}
				onSyncCms={() => handleSyncWithCms(selectedScreenId)}
				onFetchPlaylist={() => handleFetchNodePlaylist(deviceConfig)}
				onOpenCreateModal={() => setCreateModalOpen(true)}
			/>
			{error && <Alert type="error" message={error} showIcon />}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={15}>
					<Card size="small" title={activeScreen ? `LED Display: ${activeScreen.name} [${activeScreen.code}]` : 'LED Display Mockup'}>
						<LedFrameMockup
							screen={activeScreen}
							activeSlot={engine.activeSlot}
							resolvedVast={engine.resolvedVast}
							isPlaying={engine.isPlaying}
							isMuted={engine.isMuted}
							isOffline={engine.isOffline}
							remainingSeconds={engine.remainingSeconds}
							hasSlots={(playlistData?.playlist.length || 0) > 0}
							onTogglePlay={() => engine.setIsPlaying((p) => !p)}
							onToggleMute={() => engine.setIsMuted((m) => !m)}
							onToggleOffline={() => engine.setIsOffline((o) => !o)}
							onNext={engine.nextSlot}
							onImpression={engine.fireImpression}
							onComplete={engine.fireCompleteAndAdvance}
							onError={engine.handleMediaError}
						/>
					</Card>
				</Col>
				<Col xs={24} lg={9}>
					<EventDebugPanel
						playlistData={playlistData}
						activeIndex={engine.activeIndex}
						remainingSeconds={engine.remainingSeconds}
						refreshCountdown={engine.refreshCountdown}
						offlineQueuedCount={engine.offlineQueuedCount}
						beaconLogs={beaconLogs}
						onSelectSlot={engine.jumpToSlot}
						onClearLogs={() => dispatch(clearBeaconLogs())}
					/>
				</Col>
			</Row>
			<ScreenFormModal open={createModalOpen} venues={venues} loading={submitting} onCancel={() => setCreateModalOpen(false)} onSubmit={handleCreateScreen} />
		</Space>
	);
};

export default SimulatorPage;
