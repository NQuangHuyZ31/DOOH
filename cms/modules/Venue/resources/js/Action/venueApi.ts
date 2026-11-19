import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { VenueItem, ScreenItem, VenueQueryParams, ScreenQueryParams } from '../types/venue';

export const venueApi = {
	getVenues(params?: VenueQueryParams) {
		return http.get<PaginatedResponse<VenueItem>>('/venue', { params });
	},

	getVenue(id: number) {
		return http.get<ApiResponse<VenueItem>>(`/venue/${id}`);
	},

	createVenue(payload: Partial<VenueItem>) {
		return http.post<ApiResponse<VenueItem>>('/venue', payload);
	},

	updateVenue(id: number, payload: Partial<VenueItem>) {
		return http.put<ApiResponse<VenueItem>>(`/venue/${id}`, payload);
	},

	deleteVenue(id: number) {
		return http.delete<ApiResponse<{ deleted: boolean }>>(`/venue/${id}`);
	},

	generateVenueCode(city?: string, name?: string) {
		return http.get<ApiResponse<{ code: string }>>('/venue/generate-code', {
			params: { city_province: city, name },
		});
	},

	getMediaOwners() {
		return http.get<ApiResponse<Array<{ id: number; name: string; email: string }>>>('/venue/media-owners');
	},

	getScreens(params?: ScreenQueryParams) {
		return http.get<PaginatedResponse<ScreenItem>>('/venue/screen', { params });
	},

	getScreen(id: number) {
		return http.get<ApiResponse<ScreenItem>>(`/venue/screen/${id}`);
	},

	createScreen(payload: Partial<ScreenItem>) {
		return http.post<ApiResponse<ScreenItem>>('/venue/screen', payload);
	},

	updateScreen(id: number, payload: Partial<ScreenItem>) {
		return http.put<ApiResponse<ScreenItem>>(`/venue/screen/${id}`, payload);
	},

	deleteScreen(id: number) {
		return http.delete<ApiResponse<{ deleted: boolean }>>(`/venue/screen/${id}`);
	},

	regenerateScreenKey(id: number) {
		return http.post<ApiResponse<{ secret_key: string }>>(`/venue/screen/${id}/regenerate-key`);
	},

	generateScreenCode(venueCode: string) {
		return http.get<ApiResponse<{ code: string }>>('/venue/screen/generate-code', {
			params: { venue_code: venueCode },
		});
	},
};

export default venueApi;
