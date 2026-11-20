import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { defaultPagination, type PaginationConfig } from '@core/configs/pagination';
import type { CreativeItem, CreativeQueryParams } from '../types/creative';
import { fetchCreatives, createCreative, updateCreative, deleteCreative, reviewCreative } from './creativeThunk';

interface CreativeState {
	creatives: CreativeItem[];
	pagination: PaginationConfig;
	filters: CreativeQueryParams;
	loading: boolean;
	submitting: boolean;
	error: string | null;
}

const initialState: CreativeState = {
	creatives: [],
	pagination: defaultPagination,
	filters: {},
	loading: false,
	submitting: false,
	error: null,
};

export const creativeSlice = createSlice({
	name: 'creative',
	initialState,
	reducers: {
		setCreativeFilters(state, action: PayloadAction<CreativeQueryParams>) {
			state.filters = action.payload;
			state.pagination.current = 1;
		},
		setCreativePagination(state, action: PayloadAction<Partial<PaginationConfig>>) {
			state.pagination = { ...state.pagination, ...action.payload };
		},
		resetCreativeFilters(state) {
			state.filters = {};
			state.pagination.current = 1;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCreatives.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCreatives.fulfilled, (state, action) => {
				state.loading = false;
				state.creatives = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.pagination.current = action.payload.pagination.current_page;
					state.pagination.pageSize = action.payload.pagination.per_page;
					state.pagination.total = action.payload.pagination.total;
				}
			})
			.addCase(fetchCreatives.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(createCreative.pending, (state) => {
				state.submitting = true;
			})
			.addCase(createCreative.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(createCreative.rejected, (state) => {
				state.submitting = false;
			})
			.addCase(updateCreative.pending, (state) => {
				state.submitting = true;
			})
			.addCase(updateCreative.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(updateCreative.rejected, (state) => {
				state.submitting = false;
			})
			.addCase(deleteCreative.pending, (state) => {
				state.submitting = true;
			})
			.addCase(deleteCreative.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(deleteCreative.rejected, (state) => {
				state.submitting = false;
			})
			.addCase(reviewCreative.pending, (state) => {
				state.submitting = true;
			})
			.addCase(reviewCreative.fulfilled, (state, action) => {
				state.submitting = false;
				if (action.payload) {
					const idx = state.creatives.findIndex((c) => c.id === action.payload.id);
					if (idx !== -1) {
						state.creatives[idx] = action.payload;
					}
				}
			})
			.addCase(reviewCreative.rejected, (state) => {
				state.submitting = false;
			});
	},
});

export const { setCreativeFilters, setCreativePagination, resetCreativeFilters } = creativeSlice.actions;
export default creativeSlice.reducer;
