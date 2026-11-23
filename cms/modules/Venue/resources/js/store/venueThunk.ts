import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { venueApi } from '../Action/venueApi';
import type { VenueItem, ScreenItem, VenueQueryParams, ScreenQueryParams } from '../types/venue';

export const fetchVenues = createAsyncThunk(
	'venue/fetchVenues',
	async (params: VenueQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await venueApi.getVenues(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch venues.'));
		}
	},
);

export const fetchScreens = createAsyncThunk(
	'venue/fetchScreens',
	async (params: ScreenQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await venueApi.getScreens(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch screens.'));
		}
	},
);

export const createVenue = createAsyncThunk(
	'venue/createVenue',
	async (payload: Partial<VenueItem>, { rejectWithValue }) => {
		try {
			const res = await venueApi.createVenue(payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create venue.'));
		}
	},
);

export const updateVenue = createAsyncThunk(
	'venue/updateVenue',
	async ({ id, payload }: { id: number; payload: Partial<VenueItem> }, { rejectWithValue }) => {
		try {
			const res = await venueApi.updateVenue(id, payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update venue.'));
		}
	},
);

export const deleteVenue = createAsyncThunk(
	'venue/deleteVenue',
	async (id: number, { rejectWithValue }) => {
		try {
			await venueApi.deleteVenue(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete venue.'));
		}
	},
);

export const createScreen = createAsyncThunk(
	'venue/createScreen',
	async (payload: Partial<ScreenItem>, { rejectWithValue }) => {
		try {
			const res = await venueApi.createScreen(payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create screen.'));
		}
	},
);

export const updateScreen = createAsyncThunk(
	'venue/updateScreen',
	async ({ id, payload }: { id: number; payload: Partial<ScreenItem> }, { rejectWithValue }) => {
		try {
			const res = await venueApi.updateScreen(id, payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update screen.'));
		}
	},
);

export const deleteScreen = createAsyncThunk(
	'venue/deleteScreen',
	async (id: number, { rejectWithValue }) => {
		try {
			await venueApi.deleteScreen(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete screen.'));
		}
	},
);

export const regenerateScreenKey = createAsyncThunk(
	'venue/regenerateScreenKey',
	async (id: number, { rejectWithValue }) => {
		try {
			const res = await venueApi.regenerateScreenKey(id);
			return { id, secret_key: res.data?.data?.secret_key };
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to regenerate key.'));
		}
	},
);

export const fetchMediaOwners = createAsyncThunk('venue/fetchMediaOwners', async (_, { rejectWithValue }) => {
	try {
		const res = await venueApi.getMediaOwners();
		return res.data?.data || [];
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to fetch media owners.'));
	}
});
