import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BeaconLogEntry, SimulatorPlaylistData, SimulatorScreenItem } from '../types/simulator';
import { batchSyncSimulatorScreensToCms, createLocalSimulatorScreen, deleteLocalSimulatorScreen, fetchNodeDeliveryPlaylist, fetchSimulatorScreens, syncSimulatorScreenToCms } from './simulatorThunk';

export interface SimulatorState {
	localScreens: SimulatorScreenItem[];
	selectedScreenId: number | null;
	playlistData: SimulatorPlaylistData | null;
	loadingScreens: boolean;
	submitting: boolean;
	syncingScreenId: number | null;
	batchSyncing: boolean;
	loadingPlaylist: boolean;
	error: string | null;
	beaconLogs: BeaconLogEntry[];
}

const initialState: SimulatorState = {
	localScreens: [],
	selectedScreenId: null,
	playlistData: null,
	loadingScreens: false,
	submitting: false,
	syncingScreenId: null,
	batchSyncing: false,
	loadingPlaylist: false,
	error: null,
	beaconLogs: [],
};

export const simulatorSlice = createSlice({
	name: 'simulator',
	initialState,
	reducers: {
		setSelectedSimulatorScreen(state, action: PayloadAction<number | null>) {
			state.selectedScreenId = action.payload;
			state.playlistData = null;
			state.error = null;
		},
		appendBeaconLog(state, action: PayloadAction<BeaconLogEntry>) {
			state.beaconLogs = [action.payload, ...state.beaconLogs].slice(0, 60);
		},
		clearBeaconLogs(state) {
			state.beaconLogs = [];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSimulatorScreens.pending, (state) => {
				state.loadingScreens = true;
			})
			.addCase(fetchSimulatorScreens.fulfilled, (state, action) => {
				state.loadingScreens = false;
				state.localScreens = action.payload;
			})
			.addCase(fetchSimulatorScreens.rejected, (state, action) => {
				state.loadingScreens = false;
				state.error = (action.payload as string) || 'Failed to load simulator screens.';
			})
			.addCase(createLocalSimulatorScreen.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(createLocalSimulatorScreen.fulfilled, (state, action) => {
				state.submitting = false;
				state.localScreens = [action.payload, ...state.localScreens];
			})
			.addCase(createLocalSimulatorScreen.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to create local screen.';
			})
			.addCase(syncSimulatorScreenToCms.pending, (state, action) => {
				state.syncingScreenId = action.meta.arg.screen.id;
				state.error = null;
			})
			.addCase(syncSimulatorScreenToCms.fulfilled, (state, action) => {
				state.syncingScreenId = null;
				state.localScreens = state.localScreens.map((s) => (s.id === action.payload.id ? action.payload : s));
				state.selectedScreenId = action.payload.id;
			})
			.addCase(syncSimulatorScreenToCms.rejected, (state, action) => {
				state.syncingScreenId = null;
				state.error = (action.payload as string) || 'Failed to sync screen to CMS.';
			})
			.addCase(batchSyncSimulatorScreensToCms.pending, (state) => {
				state.batchSyncing = true;
				state.error = null;
			})
			.addCase(batchSyncSimulatorScreensToCms.fulfilled, (state, action) => {
				state.batchSyncing = false;
				const updatedMap = new Map(action.payload.synced.map((s) => [s.id, s]));
				state.localScreens = state.localScreens.map((s) => updatedMap.get(s.id) || s);
				if (action.payload.synced.length > 0 && !state.selectedScreenId) {
					state.selectedScreenId = action.payload.synced[0].id;
				}
			})
			.addCase(batchSyncSimulatorScreensToCms.rejected, (state, action) => {
				state.batchSyncing = false;
				state.error = (action.payload as string) || 'Failed to batch sync screens to CMS.';
			})
			.addCase(deleteLocalSimulatorScreen.fulfilled, (state, action) => {
				state.localScreens = state.localScreens.filter((s) => s.id !== action.payload);
				if (state.selectedScreenId === action.payload) {
					state.selectedScreenId = null;
					state.playlistData = null;
				}
			})
			.addCase(fetchNodeDeliveryPlaylist.pending, (state) => {
				state.loadingPlaylist = true;
				state.error = null;
			})
			.addCase(fetchNodeDeliveryPlaylist.fulfilled, (state, action) => {
				state.loadingPlaylist = false;
				state.playlistData = action.payload.data;
			})
			.addCase(fetchNodeDeliveryPlaylist.rejected, (state, action) => {
				state.loadingPlaylist = false;
				state.error = (action.payload as string) || 'Failed to fetch playlist from Node API.';
			});
	},
});

export const { setSelectedSimulatorScreen, appendBeaconLog, clearBeaconLogs } = simulatorSlice.actions;
export default simulatorSlice.reducer;
