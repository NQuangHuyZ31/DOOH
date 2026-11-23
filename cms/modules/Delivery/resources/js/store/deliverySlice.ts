import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPagination } from '@core/configs/pagination';
import type { CampaignItem, LineItem, PlaylistPreviewData, DeliveryQueryParams } from '../types/delivery';
import { fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, fetchLineItems, createLineItem, createBatchLineItems, updateLineItem, deleteLineItem, fetchPlaylistPreview } from './deliveryThunk';

export interface DeliveryState {
	campaigns: CampaignItem[];
	campaignPagination: { current: number; pageSize: number; total: number };
	campaignFilters: DeliveryQueryParams;
	selectedCampaign: CampaignItem | null;
	campaignModalOpen: boolean;

	lineItems: LineItem[];
	lineItemPagination: { current: number; pageSize: number; total: number };
	lineItemFilters: DeliveryQueryParams;
	selectedLineItem: LineItem | null;
	lineItemModalOpen: boolean;

	playlistPreview: PlaylistPreviewData | null;
	playlistModalOpen: boolean;

	loading: boolean;
	submitting: boolean;
	error: string | null;
}

const initialState: DeliveryState = {
	campaigns: [],
	campaignPagination: { current: defaultPagination.current, pageSize: defaultPagination.pageSize, total: defaultPagination.total },
	campaignFilters: {},
	selectedCampaign: null,
	campaignModalOpen: false,

	lineItems: [],
	lineItemPagination: { current: defaultPagination.current, pageSize: defaultPagination.pageSize, total: defaultPagination.total },
	lineItemFilters: {},
	selectedLineItem: null,
	lineItemModalOpen: false,

	playlistPreview: null,
	playlistModalOpen: false,

	loading: false,
	submitting: false,
	error: null,
};

export const deliverySlice = createSlice({
	name: 'delivery',
	initialState,
	reducers: {
		setCampaignFilters: (state, action: PayloadAction<DeliveryQueryParams>) => {
			state.campaignFilters = action.payload;
			state.campaignPagination.current = 1;
		},
		setSelectedCampaign: (state, action: PayloadAction<CampaignItem | null>) => {
			state.selectedCampaign = action.payload;
		},
		setCampaignModalOpen: (state, action: PayloadAction<boolean>) => {
			state.campaignModalOpen = action.payload;
			if (!action.payload) {
				state.selectedCampaign = null;
			}
		},
		setLineItemFilters: (state, action: PayloadAction<DeliveryQueryParams>) => {
			state.lineItemFilters = action.payload;
			state.lineItemPagination.current = 1;
		},
		setSelectedLineItem: (state, action: PayloadAction<LineItem | null>) => {
			state.selectedLineItem = action.payload;
		},
		setLineItemModalOpen: (state, action: PayloadAction<boolean>) => {
			state.lineItemModalOpen = action.payload;
			if (!action.payload) {
				state.selectedLineItem = null;
			}
		},
		setPlaylistModalOpen: (state, action: PayloadAction<boolean>) => {
			state.playlistModalOpen = action.payload;
			if (!action.payload) {
				state.playlistPreview = null;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			// Campaigns
			.addCase(fetchCampaigns.pending, (state) => { state.loading = true; state.error = null; })
			.addCase(fetchCampaigns.fulfilled, (state, action) => {
				state.loading = false;
				state.campaigns = action.payload.data || [];
				if (action.payload.pagination) {
					state.campaignPagination = {
						current: action.payload.pagination.current_page,
						pageSize: action.payload.pagination.per_page,
						total: action.payload.pagination.total,
					};
				}
			})
			.addCase(fetchCampaigns.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) || 'Failed to fetch campaigns';
			})
			.addCase(createCampaign.pending, (state) => { state.submitting = true; })
			.addCase(createCampaign.fulfilled, (state, action) => {
				state.submitting = false;
				state.campaignModalOpen = false;
				state.campaigns.unshift(action.payload);
				state.campaignPagination.total += 1;
			})
			.addCase(createCampaign.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to create campaign';
			})
			.addCase(updateCampaign.pending, (state) => { state.submitting = true; })
			.addCase(updateCampaign.fulfilled, (state, action) => {
				state.submitting = false;
				state.campaignModalOpen = false;
				const idx = state.campaigns.findIndex((c) => c.id === action.payload.id);
				if (idx !== -1) {
					state.campaigns[idx] = action.payload;
				}
			})
			.addCase(updateCampaign.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to update campaign';
			})
			.addCase(deleteCampaign.fulfilled, (state, action) => {
				state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
				state.campaignPagination.total = Math.max(0, state.campaignPagination.total - 1);
			})
			// Line Items
			.addCase(fetchLineItems.pending, (state) => { state.loading = true; state.error = null; })
			.addCase(fetchLineItems.fulfilled, (state, action) => {
				state.loading = false;
				state.lineItems = action.payload.data || [];
				if (action.payload.pagination) {
					state.lineItemPagination = {
						current: action.payload.pagination.current_page,
						pageSize: action.payload.pagination.per_page,
						total: action.payload.pagination.total,
					};
				}
			})
			.addCase(fetchLineItems.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) || 'Failed to fetch line items';
			})
			.addCase(createLineItem.pending, (state) => { state.submitting = true; })
			.addCase(createLineItem.fulfilled, (state, action) => {
				state.submitting = false;
				state.lineItemModalOpen = false;
				state.lineItems.unshift(action.payload);
				state.lineItemPagination.total += 1;
			})
			.addCase(createLineItem.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to create line item';
			})
			.addCase(createBatchLineItems.pending, (state) => { state.submitting = true; })
			.addCase(createBatchLineItems.fulfilled, (state, action) => {
				state.submitting = false;
				state.lineItemModalOpen = false;
				state.lineItems.unshift(...action.payload);
				state.lineItemPagination.total += action.payload.length;
			})
			.addCase(createBatchLineItems.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to batch create line items';
			})
			.addCase(updateLineItem.pending, (state) => { state.submitting = true; })
			.addCase(updateLineItem.fulfilled, (state, action) => {
				state.submitting = false;
				state.lineItemModalOpen = false;
				const idx = state.lineItems.findIndex((li) => li.id === action.payload.id);
				if (idx !== -1) {
					state.lineItems[idx] = action.payload;
				}
			})
			.addCase(updateLineItem.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) || 'Failed to update line item';
			})
			.addCase(deleteLineItem.fulfilled, (state, action) => {
				state.lineItems = state.lineItems.filter((li) => li.id !== action.payload);
				state.lineItemPagination.total = Math.max(0, state.lineItemPagination.total - 1);
			})
			// Playlist Preview
			.addCase(fetchPlaylistPreview.pending, (state) => { state.loading = true; })
			.addCase(fetchPlaylistPreview.fulfilled, (state, action) => {
				state.loading = false;
				state.playlistPreview = action.payload;
				state.playlistModalOpen = true;
			})
			.addCase(fetchPlaylistPreview.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) || 'Failed to generate playlist preview';
			});
	},
});

export const {
	setCampaignFilters, setSelectedCampaign, setCampaignModalOpen,
	setLineItemFilters, setSelectedLineItem, setLineItemModalOpen,
	setPlaylistModalOpen,
} = deliverySlice.actions;

export default deliverySlice.reducer;
