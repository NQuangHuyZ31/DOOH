import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { VenueItem, ScreenItem, VenueQueryParams, ScreenQueryParams } from '../types/venue';
import {
	fetchVenues,
	fetchScreens,
	fetchMediaOwners,
	createVenue,
	updateVenue,
	deleteVenue,
	createScreen,
	updateScreen,
	deleteScreen,
	regenerateScreenKey,
} from './venueThunk';

export interface VenueState {
	venues: VenueItem[];
	venuePagination: { current: number; pageSize: number; total: number };
	venueFilters: VenueQueryParams;
	screens: ScreenItem[];
	screenPagination: { current: number; pageSize: number; total: number };
	screenFilters: ScreenQueryParams;
	mediaOwners: Array<{ id: number; name: string; email: string }>;
	loading: boolean;
	submitting: boolean;
	selectedVenue: VenueItem | null;
	selectedScreen: ScreenItem | null;
	error: string | null;
}

const initialState: VenueState = {
	venues: [],
	venuePagination: { current: 1, pageSize: 15, total: 0 },
	venueFilters: {},
	screens: [],
	screenPagination: { current: 1, pageSize: 15, total: 0 },
	screenFilters: {},
	mediaOwners: [],
	loading: false,
	submitting: false,
	selectedVenue: null,
	selectedScreen: null,
	error: null,
};

export const venueSlice = createSlice({
	name: 'venue',
	initialState,
	reducers: {
		setSelectedVenue(state, action: PayloadAction<VenueItem | null>) {
			state.selectedVenue = action.payload;
		},
		setSelectedScreen(state, action: PayloadAction<ScreenItem | null>) {
			state.selectedScreen = action.payload;
		},
		setVenueFilters(state, action: PayloadAction<VenueQueryParams>) {
			state.venueFilters = action.payload;
			state.venuePagination.current = 1;
		},
		setScreenFilters(state, action: PayloadAction<ScreenQueryParams>) {
			state.screenFilters = action.payload;
			state.screenPagination.current = 1;
		},
		clearVenueError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchVenues.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchVenues.fulfilled, (state, action) => {
				state.loading = false;
				state.venues = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.venuePagination = {
						current: action.payload.pagination.current_page,
						pageSize: action.payload.pagination.per_page,
						total: action.payload.pagination.total,
					};
				}
			})
			.addCase(fetchVenues.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchScreens.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchScreens.fulfilled, (state, action) => {
				state.loading = false;
				state.screens = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.screenPagination = {
						current: action.payload.pagination.current_page,
						pageSize: action.payload.pagination.per_page,
						total: action.payload.pagination.total,
					};
				}
			})
			.addCase(fetchScreens.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(createVenue.pending, (state) => {
				state.submitting = true;
			})
			.addCase(createVenue.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(createVenue.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload as string;
			})
			.addCase(updateVenue.pending, (state) => {
				state.submitting = true;
			})
			.addCase(updateVenue.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(updateVenue.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload as string;
			})
			.addCase(deleteVenue.fulfilled, (state, action) => {
				state.venues = state.venues.filter((v) => v.id !== action.payload);
			})
			.addCase(createScreen.pending, (state) => {
				state.submitting = true;
			})
			.addCase(createScreen.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(createScreen.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload as string;
			})
			.addCase(updateScreen.pending, (state) => {
				state.submitting = true;
			})
			.addCase(updateScreen.fulfilled, (state) => {
				state.submitting = false;
			})
			.addCase(updateScreen.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload as string;
			})
			.addCase(deleteScreen.fulfilled, (state, action) => {
				state.screens = state.screens.filter((s) => s.id !== action.payload);
			})
			.addCase(regenerateScreenKey.fulfilled, (state, action) => {
				const screen = state.screens.find((s) => s.id === action.payload.id);
				if (screen && action.payload.secret_key) {
					screen.secret_key = action.payload.secret_key;
				}
			})
			.addCase(fetchMediaOwners.fulfilled, (state, action) => {
				state.mediaOwners = action.payload || [];
			});
	},
});

export const { setSelectedVenue, setSelectedScreen, setVenueFilters, setScreenFilters, clearVenueError } = venueSlice.actions;
export default venueSlice.reducer;
