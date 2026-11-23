import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { VendorItem, VendorQueryParams, CreateVendorResponse, RegenerateApiKeyResponse } from '../types/vendor';

export const vendorApi = {
	getVendors(params?: VendorQueryParams) {
		return http.get<PaginatedResponse<VendorItem>>('/vendor', { params });
	},

	getVendor(id: number) {
		return http.get<ApiResponse<VendorItem>>(`/vendor/vendor/${id}`);
	},

	createVendor(payload: Partial<VendorItem>) {
		return http.post<ApiResponse<CreateVendorResponse>>('/vendor', payload);
	},

	updateVendor(id: number, payload: Partial<VendorItem>) {
		return http.put<ApiResponse<VendorItem>>(`/vendor/vendor/${id}`, payload);
	},

	deleteVendor(id: number) {
		return http.delete<ApiResponse<{ id: number }>>(`/vendor/vendor/${id}`);
	},

	regenerateApiKey(id: number) {
		return http.post<ApiResponse<RegenerateApiKeyResponse>>(`/vendor/vendor/${id}/regenerate-api-key`);
	},
};

export default vendorApi;
