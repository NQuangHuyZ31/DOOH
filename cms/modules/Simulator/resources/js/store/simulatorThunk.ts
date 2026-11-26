import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { simulatorApi } from '../Action/simulatorApi';
import type { SimulatorDeviceConfig, SimulatorPlaylistData } from '../types/simulator';

export const syncSimulatorDevice = createAsyncThunk<SimulatorDeviceConfig, number, { rejectValue: string }>('simulator/syncDevice', async (screenId, { rejectWithValue }) => {
	try {
		return await simulatorApi.syncDevice(screenId);
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to sync screen config from CMS.'));
	}
});

export const fetchNodeDeliveryPlaylist = createAsyncThunk<{ data: SimulatorPlaylistData; statusCode: number; latencyMs: number }, SimulatorDeviceConfig, { rejectValue: string }>(
	'simulator/fetchNodePlaylist',
	async (device, { rejectWithValue }) => {
		try {
			return await simulatorApi.fetchNodePlaylist(device);
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch playlist from Node Delivery API.'));
		}
	},
);
