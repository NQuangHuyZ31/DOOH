import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { simulatorApi } from '../Action/simulatorApi';
import type { BatchSyncResult, CreateLocalScreenPayload, SimulatorPlaylistData, SimulatorScreenItem } from '../types/simulator';

export const fetchSimulatorScreens = createAsyncThunk<SimulatorScreenItem[], void, { rejectValue: string }>('simulator/fetchScreens', async (_, { rejectWithValue }) => {
	try {
		return await simulatorApi.listScreens();
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to load simulator screens.'));
	}
});

export const createLocalSimulatorScreen = createAsyncThunk<SimulatorScreenItem, CreateLocalScreenPayload, { rejectValue: string }>(
	'simulator/createLocalScreen',
	async (payload, { rejectWithValue }) => {
		try {
			return await simulatorApi.createLocalScreen(payload);
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create local screen.'));
		}
	},
);

export const syncSimulatorScreenToCms = createAsyncThunk<SimulatorScreenItem, { screen: SimulatorScreenItem; partnerApiKey: string }, { rejectValue: string }>(
	'simulator/syncToCms',
	async ({ screen, partnerApiKey }, { rejectWithValue }) => {
		try {
			return await simulatorApi.syncScreenToCms(screen, partnerApiKey);
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to sync screen to CMS.'));
		}
	},
);

export const batchSyncSimulatorScreensToCms = createAsyncThunk<BatchSyncResult, { screens: SimulatorScreenItem[]; partnerApiKey: string }, { rejectValue: string }>(
	'simulator/batchSyncToCms',
	async ({ screens, partnerApiKey }, { rejectWithValue }) => {
		try {
			return await simulatorApi.batchSyncScreensToCms(screens, partnerApiKey);
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to batch sync screens to CMS.'));
		}
	},
);

export const deleteLocalSimulatorScreen = createAsyncThunk<number, number, { rejectValue: string }>('simulator/deleteLocalScreen', async (id, { rejectWithValue }) => {
	try {
		await simulatorApi.deleteLocalScreen(id);
		return id;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to delete simulator screen.'));
	}
});

export const fetchNodeDeliveryPlaylist = createAsyncThunk<
	{ data: SimulatorPlaylistData; statusCode: number; latencyMs: number },
	SimulatorScreenItem,
	{ rejectValue: string }
>('simulator/fetchNodePlaylist', async (screen, { rejectWithValue }) => {
	try {
		return await simulatorApi.fetchNodePlaylist(screen);
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to fetch playlist from Node Delivery API.'));
	}
});
