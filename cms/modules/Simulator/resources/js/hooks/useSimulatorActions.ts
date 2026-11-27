import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { batchSyncSimulatorScreensToCms, createLocalSimulatorScreen, deleteLocalSimulatorScreen, fetchNodeDeliveryPlaylist, fetchSimulatorScreens, syncSimulatorScreenToCms } from '../store/simulatorThunk';
import { appendBeaconLog, clearBeaconLogs, setSelectedSimulatorScreen } from '../store/simulatorSlice';
import type { CreateLocalScreenPayload, SimulatorScreenItem } from '../types/simulator';

const makeNow = (): string => new Date().toLocaleTimeString('en-GB', { hour12: false });

export const useSimulatorActions = () => {
	const dispatch = useAppDispatch();
	const state = useAppSelector((s) => s.simulator);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [syncTargets, setSyncTargets] = useState<SimulatorScreenItem[]>([]);

	useEffect(() => {
		dispatch(fetchSimulatorScreens());
	}, [dispatch]);

	const syncedScreens = state.localScreens.filter((s) => s.sync_status === 'synced');
	const selectedScreen = syncedScreens.find((s) => s.id === state.selectedScreenId) || null;

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
			dispatch(appendBeaconLog({ id: `${Date.now()}-batch`, timestamp: makeNow(), event: 'CMS_SYNC', statusCode: 200, latencyMs: Math.round(performance.now() - started), detail: `Batch ${res.synced_count}/${res.total} synced` }));
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

	const handleClearLogs = () => dispatch(clearBeaconLogs());

	return {
		...state,
		syncedScreens,
		selectedScreen,
		createModalOpen,
		setCreateModalOpen,
		syncTargets,
		setSyncTargets,
		handleFetchNodePlaylist,
		handleConfirmSync,
		handleCreateLocalScreen,
		handleDeleteScreen,
		handleLoadScreen,
		handleClearLogs,
	};
};
