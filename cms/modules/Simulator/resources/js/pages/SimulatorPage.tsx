import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Space, message } from 'antd';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { toScreenMeta } from '../Action/simulatorApi';
import { batchSyncSimulatorScreensToCms, createLocalSimulatorScreen, deleteLocalSimulatorScreen, fetchNodeDeliveryPlaylist, fetchSimulatorScreens, syncSimulatorScreenToCms } from '../store/simulatorThunk';
import { appendBeaconLog, clearBeaconLogs, setSelectedSimulatorScreen } from '../store/simulatorSlice';
import { usePlayerEngine } from '../hooks/usePlayerEngine';
import { SimulatorToolbar } from '../components/SimulatorToolbar';
import { PartnerScreenList } from '../components/PartnerScreenList';
import { LocalScreenFormModal } from '../components/LocalScreenFormModal';
import { SyncApiKeyModal } from '../components/SyncApiKeyModal';
import { LedFrameMockup } from '../components/LedFrameMockup';
import { EventDebugPanel } from '../components/EventDebugPanel';
import type { CreateLocalScreenPayload, SimulatorScreenItem } from '../types/simulator';

const makeNow = (): string => new Date().toLocaleTimeString('en-GB', { hour12: false });

export const SimulatorPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { localScreens, selectedScreenId, playlistData, loadingScreens, submitting, syncingScreenId, batchSyncing, loadingPlaylist, error, beaconLogs } = useAppSelector((state) => state.simulator);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [syncTargets, setSyncTargets] = useState<SimulatorScreenItem[]>([]);

	useEffect(() => {
		dispatch(fetchSimulatorScreens());
	}, [dispatch]);

	const syncedScreens = localScreens.filter((s) => s.sync_status === 'synced');
	const selectedScreen = syncedScreens.find((s) => s.id === selectedScreenId) || null;

	const handleFetchNodePlaylist = useCallback(
		async (target: SimulatorScreenItem | null = selectedScreen) => {
			if (!target || target.sync_status !== 'synced') return;
			try {
				const res = await dispatch(fetchNodeDeliveryPlaylist(target)).unwrap();
				dispatch(appendBeaconLog({ id: `${Date.now()}-pl`, timestamp: makeNow(), event: 'NODE_PLAYLIST', statusCode: res.statusCode, latencyMs: res.latencyMs, detail: `${res.data.slots_count} slot(s)` }));
			} catch (err: unknown) {
				const msg = extractErrorMessage(err, 'Node Delivery API request failed.');
				dispatch(appendBeaconLog({ id: `${Date.now()}-pl-err`, timestamp: makeNow(), event: 'NODE_PLAYLIST', statusCode: 'ERR', latencyMs: 0, detail: msg }));
				message.error(msg);
			}
		},
		[dispatch, selectedScreen],
	);

	const handleConfirmSync = async (partnerApiKey: string) => {
		if (syncTargets.length === 0) return;
		const started = performance.now();
		try {
			if (syncTargets.length === 1) {
				const synced = await dispatch(syncSimulatorScreenToCms({ screen: syncTargets[0], partnerApiKey })).unwrap();
				dispatch(appendBeaconLog({ id: `${Date.now()}-cms`, timestamp: makeNow(), event: 'CMS_SYNC', statusCode: 201, latencyMs: Math.round(performance.now() - started), detail: `Registered ${synced.code}` }));
				message.success(`Synced "${synced.name}" as ${synced.code}.`);
				setSyncTargets([]);
				await handleFetchNodePlaylist(synced);
				return;
			}
			const res = await dispatch(batchSyncSimulatorScreensToCms({ screens: syncTargets, partnerApiKey })).unwrap();
			dispatch(
				appendBeaconLog({ id: `${Date.now()}-batch`, timestamp: makeNow(), event: 'CMS_SYNC', statusCode: 200, latencyMs: Math.round(performance.now() - started), detail: `Batch ${res.synced_count}/${res.total} synced` }),
			);
			if (res.failed_count > 0) message.warning(`Synced ${res.synced_count}/${res.total} screens (${res.failed_count} failed).`);
			else message.success(`Synced all ${res.synced_count} screens successfully.`);
			setSyncTargets([]);
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to sync screens to CMS.'));
		}
	};

	const handleCreateLocalScreen = async (values: CreateLocalScreenPayload) => {
		try {
			const created = await dispatch(createLocalSimulatorScreen(values)).unwrap();
			message.success(`Local screen "${created.name}" added (Unsynced). Click "Sync to CMS" to register.`);
			setCreateModalOpen(false);
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to create local screen.'));
		}
	};

	const handleDeleteScreen = async (id: number) => {
		try {
			await dispatch(deleteLocalSimulatorScreen(id)).unwrap();
			message.success('Simulator screen removed.');
		} catch (err: unknown) {
			message.error(extractErrorMessage(err, 'Failed to delete screen.'));
		}
	};

	const handleLoadScreen = (screen: SimulatorScreenItem) => {
		dispatch(setSelectedSimulatorScreen(screen.id));
		handleFetchNodePlaylist(screen);
	};

	const engine = usePlayerEngine(playlistData, () => handleFetchNodePlaylist(selectedScreen));
	const activeScreenMeta = selectedScreen ? toScreenMeta(selectedScreen) : null;

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<SimulatorToolbar
				syncedScreens={syncedScreens}
				selectedScreen={selectedScreen}
				loadingPlaylist={loadingPlaylist}
				onSelectScreen={(id) => {
					const found = syncedScreens.find((s) => s.id === id);
					if (found) handleLoadScreen(found);
				}}
				onFetchPlaylist={() => handleFetchNodePlaylist(selectedScreen)}
				onOpenCreateModal={() => setCreateModalOpen(true)}
			/>
			<PartnerScreenList
				screens={localScreens}
				selectedScreenId={selectedScreenId}
				syncingScreenId={syncingScreenId}
				batchSyncing={batchSyncing}
				loading={loadingScreens}
				onSyncToCms={(screen) => setSyncTargets([screen])}
				onBatchSyncAll={(unsynced) => setSyncTargets(unsynced)}
				onLoadPlayer={handleLoadScreen}
				onDelete={handleDeleteScreen}
			/>
			{error && <Alert type="error" message={error} showIcon />}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={15}>
					<Card size="small" title={activeScreenMeta ? `LED Display: ${activeScreenMeta.name} [${activeScreenMeta.code}]` : 'LED Display Mockup'}>
						<LedFrameMockup
							screen={activeScreenMeta}
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
			<LocalScreenFormModal open={createModalOpen} loading={submitting} onCancel={() => setCreateModalOpen(false)} onSubmit={handleCreateLocalScreen} />
			<SyncApiKeyModal open={syncTargets.length > 0} targets={syncTargets} loading={syncingScreenId !== null || batchSyncing} onCancel={() => setSyncTargets([])} onConfirm={handleConfirmSync} />
		</Space>
	);
};

export default SimulatorPage;
