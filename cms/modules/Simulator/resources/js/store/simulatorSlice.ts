import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BeaconLogEntry, SimulatorDeviceConfig, SimulatorPlaylistData } from '../types/simulator';
import { fetchNodeDeliveryPlaylist, syncSimulatorDevice } from './simulatorThunk';

export interface SimulatorState {
	selectedScreenId: number | null;
	deviceConfig: SimulatorDeviceConfig | null;
	playlistData: SimulatorPlaylistData | null;
	syncingDevice: boolean;
	loadingPlaylist: boolean;
	error: string | null;
	beaconLogs: BeaconLogEntry[];
}

const initialState: SimulatorState = {
	selectedScreenId: null,
	deviceConfig: null,
	playlistData: null,
	syncingDevice: false,
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
			state.deviceConfig = null;
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
			.addCase(syncSimulatorDevice.pending, (state) => {
				state.syncingDevice = true;
				state.error = null;
			})
			.addCase(syncSimulatorDevice.fulfilled, (state, action) => {
				state.syncingDevice = false;
				state.deviceConfig = action.payload;
			})
			.addCase(syncSimulatorDevice.rejected, (state, action) => {
				state.syncingDevice = false;
				state.error = (action.payload as string) || 'Failed to sync device with CMS.';
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
