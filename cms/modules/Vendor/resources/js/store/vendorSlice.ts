import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { VendorItem, VendorQueryParams } from '../types/vendor';
import { fetchVendors, createVendor, updateVendor, deleteVendor, regenerateApiKey } from './vendorThunk';

export interface VendorState {
	vendors: VendorItem[];
	pagination: { current: number; pageSize: number; total: number };
	filters: VendorQueryParams;
	loading: boolean;
	submitting: boolean;
	selectedVendor: VendorItem | null;
	generatedApiKey: string | null;
	keyModalOpen: boolean;
	formModalOpen: boolean;
	error: string | null;
}

const initialState: VendorState = {
	vendors: [],
	pagination: { current: 1, pageSize: 15, total: 0 },
	filters: {},
	loading: false,
	submitting: false,
	selectedVendor: null,
	generatedApiKey: null,
	keyModalOpen: false,
	formModalOpen: false,
	error: null,
};

export const vendorSlice = createSlice({
	name: 'vendor',
	initialState,
	reducers: {
		setSelectedVendor(state, action: PayloadAction<VendorItem | null>) {
			state.selectedVendor = action.payload;
		},
		setFilters(state, action: PayloadAction<VendorQueryParams>) {
			state.filters = action.payload;
		},
		setFormModalOpen(state, action: PayloadAction<boolean>) {
			state.formModalOpen = action.payload;
			if (!action.payload) {
				state.selectedVendor = null;
			}
		},
		setKeyModalOpen(state, action: PayloadAction<boolean>) {
			state.keyModalOpen = action.payload;
			if (!action.payload) {
				state.generatedApiKey = null;
			}
		},
		clearGeneratedApiKey(state) {
			state.generatedApiKey = null;
			state.keyModalOpen = false;
		},
	},
	extraReducers: (builder) => {
		builder
			// fetchVendors
			.addCase(fetchVendors.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchVendors.fulfilled, (state, action) => {
				state.loading = false;
				state.vendors = action.payload?.data ?? [];
				const p = action.payload?.pagination;
				if (p) {
					state.pagination = { current: p.current_page, pageSize: p.per_page, total: p.total };
				}
			})
			.addCase(fetchVendors.rejected, (state, action) => {
				state.loading = false;
				state.error = (action.payload as string) ?? 'Failed to load vendors';
			})
			// createVendor
			.addCase(createVendor.pending, (state) => {
				state.submitting = true;
			})
			.addCase(createVendor.fulfilled, (state, action) => {
				state.submitting = false;
				state.formModalOpen = false;
				if (action.payload?.vendor) {
					state.vendors.unshift(action.payload.vendor);
					state.pagination.total += 1;
				}
				if (action.payload?.plain_api_key) {
					state.generatedApiKey = action.payload.plain_api_key;
					state.keyModalOpen = true;
				}
			})
			.addCase(createVendor.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) ?? 'Failed to create vendor';
			})
			// updateVendor
			.addCase(updateVendor.pending, (state) => {
				state.submitting = true;
			})
			.addCase(updateVendor.fulfilled, (state, action) => {
				state.submitting = false;
				state.formModalOpen = false;
				state.selectedVendor = null;
				if (action.payload) {
					const idx = state.vendors.findIndex((v) => v.id === action.payload.id);
					if (idx >= 0) {
						state.vendors[idx] = action.payload;
					}
				}
			})
			.addCase(updateVendor.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) ?? 'Failed to update vendor';
			})
			// deleteVendor
			.addCase(deleteVendor.fulfilled, (state, action) => {
				state.vendors = state.vendors.filter((v) => v.id !== action.payload);
				state.pagination.total = Math.max(0, state.pagination.total - 1);
			})
			// regenerateApiKey
			.addCase(regenerateApiKey.pending, (state) => {
				state.submitting = true;
			})
			.addCase(regenerateApiKey.fulfilled, (state, action) => {
				state.submitting = false;
				if (action.payload?.vendor) {
					const idx = state.vendors.findIndex((v) => v.id === action.payload.vendor.id);
					if (idx >= 0) {
						state.vendors[idx] = action.payload.vendor;
					}
				}
				if (action.payload?.plain_api_key) {
					state.generatedApiKey = action.payload.plain_api_key;
					state.keyModalOpen = true;
				}
			})
			.addCase(regenerateApiKey.rejected, (state, action) => {
				state.submitting = false;
				state.error = (action.payload as string) ?? 'Failed to regenerate API key';
			});
	},
});

export const { setSelectedVendor, setFilters, setFormModalOpen, setKeyModalOpen, clearGeneratedApiKey } = vendorSlice.actions;
export default vendorSlice.reducer;
