import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { deliveryApi } from '../Action/deliveryApi';
import type { CampaignItem, LineItem, PlaylistPreviewData, DeliveryQueryParams } from '../types/delivery';

export const fetchCampaigns = createAsyncThunk(
	'delivery/fetchCampaigns',
	async (params: DeliveryQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.getCampaigns(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch campaigns.'));
		}
	},
);

export const createCampaign = createAsyncThunk(
	'delivery/createCampaign',
	async (payload: Partial<CampaignItem>, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.createCampaign(payload);
			return res.data?.data as CampaignItem;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create campaign.'));
		}
	},
);

export const updateCampaign = createAsyncThunk(
	'delivery/updateCampaign',
	async ({ id, payload }: { id: number; payload: Partial<CampaignItem> }, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.updateCampaign(id, payload);
			return res.data?.data as CampaignItem;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update campaign.'));
		}
	},
);

export const deleteCampaign = createAsyncThunk(
	'delivery/deleteCampaign',
	async (id: number, { rejectWithValue }) => {
		try {
			await deliveryApi.deleteCampaign(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete campaign.'));
		}
	},
);

export const fetchLineItems = createAsyncThunk(
	'delivery/fetchLineItems',
	async (params: DeliveryQueryParams | undefined, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.getLineItems(params);
			return res.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch line items.'));
		}
	},
);

export const createLineItem = createAsyncThunk(
	'delivery/createLineItem',
	async (payload: Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> }, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.createLineItem(payload);
			return res.data?.data as LineItem;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create line item.'));
		}
	},
);

export const createBatchLineItems = createAsyncThunk(
	'delivery/createBatchLineItems',
	async (items: Array<Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> }>, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.createBatchLineItems(items);
			return res.data?.data as LineItem[];
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to batch create line items.'));
		}
	},
);

export const updateLineItem = createAsyncThunk(
	'delivery/updateLineItem',
	async ({ id, payload }: { id: number; payload: Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> } }, { rejectWithValue }) => {
		try {
			const res = await deliveryApi.updateLineItem(id, payload);
			return res.data?.data as LineItem;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to update line item.'));
		}
	},
);

export const deleteLineItem = createAsyncThunk(
	'delivery/deleteLineItem',
	async (id: number, { rejectWithValue }) => {
		try {
			await deliveryApi.deleteLineItem(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete line item.'));
		}
	},
);

export const fetchPlaylistPreview = createAsyncThunk(
	'delivery/fetchPlaylistPreview',
	async (params: { venue_id?: number; screen_id?: number } | number, { rejectWithValue }) => {
		try {
			const query = typeof params === 'number' ? { venue_id: params } : params;
			const res = await deliveryApi.getPlaylistPreview(query);
			return res.data?.data as PlaylistPreviewData;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to fetch playlist preview.'));
		}
	},
);
