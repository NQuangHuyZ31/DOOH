import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { CreativeItem, CreativeQueryParams, CreativeFormData, CreativeReviewPayload } from '../types/creative';

export const creativeApi = {
	getCreatives(params?: CreativeQueryParams) {
		return http.get<PaginatedResponse<CreativeItem>>('/creative', { params });
	},

	getCreative(id: number) {
		return http.get<ApiResponse<CreativeItem>>(`/creative/${id}`);
	},

	createCreative(payload: CreativeFormData) {
		return http.post<ApiResponse<CreativeItem>>('/creative', payload);
	},

	createBatch(items: CreativeFormData[]) {
		return http.post<ApiResponse<CreativeItem[]>>('/creative/batch', { items });
	},

	updateCreative(id: number, payload: Partial<CreativeFormData>) {
		return http.put<ApiResponse<CreativeItem>>(`/creative/${id}`, payload);
	},

	deleteCreative(id: number) {
		return http.delete<ApiResponse<{ deleted: boolean }>>(`/creative/${id}`);
	},

	reviewCreative(id: number, payload: CreativeReviewPayload) {
		return http.put<ApiResponse<CreativeItem>>(`/creative/${id}/status`, payload);
	},
};

export default creativeApi;
