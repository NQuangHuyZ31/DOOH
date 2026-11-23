import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { vendorApi } from '../Action/vendorApi';
import type { VendorItem, VendorQueryParams, CreateVendorResponse, RegenerateApiKeyResponse } from '../types/vendor';

export const fetchVendors = createAsyncThunk(
	'vendor/fetchVendors',
	async (params: VendorQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await vendorApi.getVendors(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch vendors.'));
		}
	},
);

export const createVendor = createAsyncThunk(
	'vendor/createVendor',
	async (payload: Partial<VendorItem>, { rejectWithValue }) => {
		try {
			const res = await vendorApi.createVendor(payload);
			return res.data?.data as CreateVendorResponse;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create vendor.'));
		}
	},
);

export const updateVendor = createAsyncThunk(
	'vendor/updateVendor',
	async ({ id, payload }: { id: number; payload: Partial<VendorItem> }, { rejectWithValue }) => {
		try {
			const res = await vendorApi.updateVendor(id, payload);
			return res.data?.data as VendorItem;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update vendor.'));
		}
	},
);

export const deleteVendor = createAsyncThunk(
	'vendor/deleteVendor',
	async (id: number, { rejectWithValue }) => {
		try {
			await vendorApi.deleteVendor(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete vendor.'));
		}
	},
);

export const regenerateApiKey = createAsyncThunk(
	'vendor/regenerateApiKey',
	async (id: number, { rejectWithValue }) => {
		try {
			const res = await vendorApi.regenerateApiKey(id);
			return res.data?.data as RegenerateApiKeyResponse;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to regenerate API key.'));
		}
	},
);
