import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { creativeApi } from '../Action/creativeApi';
import type { CreativeQueryParams, CreativeFormData, CreativeReviewPayload } from '../types/creative';

export const fetchCreatives = createAsyncThunk(
	'creative/fetchCreatives',
	async (params: CreativeQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await creativeApi.getCreatives(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch creatives.'));
		}
	},
);

export const createCreative = createAsyncThunk(
	'creative/createCreative',
	async (payload: CreativeFormData, { rejectWithValue }) => {
		try {
			const res = await creativeApi.createCreative(payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create creative.'));
		}
	},
);

export const updateCreative = createAsyncThunk(
	'creative/updateCreative',
	async ({ id, payload }: { id: number; payload: Partial<CreativeFormData> }, { rejectWithValue }) => {
		try {
			const res = await creativeApi.updateCreative(id, payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update creative.'));
		}
	},
);

export const deleteCreative = createAsyncThunk(
	'creative/deleteCreative',
	async (id: number, { rejectWithValue }) => {
		try {
			await creativeApi.deleteCreative(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete creative.'));
		}
	},
);

export const reviewCreative = createAsyncThunk(
	'creative/reviewCreative',
	async ({ id, payload }: { id: number; payload: CreativeReviewPayload }, { rejectWithValue }) => {
		try {
			const res = await creativeApi.reviewCreative(id, payload);
			return res.data?.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to review creative.'));
		}
	},
);
