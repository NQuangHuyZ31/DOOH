import { createSlice } from '@reduxjs/toolkit';
import type { CmsMetadata, MetadataOption } from '../types/metadata';
import { fetchMetadata } from './metadataThunk';

export const EMPTY_METADATA_OPTIONS: MetadataOption[] = [];

export interface MetadataState {
	data: CmsMetadata | null;
	loading: boolean;
	initialized: boolean;
	error: string | null;
}

const initialState: MetadataState = {
	data: null,
	loading: false,
	initialized: false,
	error: null,
};

export const metadataSlice = createSlice({
	name: 'metadata',
	initialState,
	reducers: {
		clearMetadata: (state) => {
			state.data = null;
			state.initialized = false;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMetadata.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMetadata.fulfilled, (state, action) => {
				state.loading = false;
				state.initialized = true;
				const nextData = state.data ? { ...state.data, ...action.payload } : action.payload;
				if (JSON.stringify(state.data) !== JSON.stringify(nextData)) {
					state.data = nextData;
				}
			})
			.addCase(fetchMetadata.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload || null;
			});
	},
});

export const { clearMetadata } = metadataSlice.actions;

export default metadataSlice.reducer;
