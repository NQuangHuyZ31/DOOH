import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { CampaignItem, LineItem, PlaylistPreviewData, DeliveryQueryParams } from '../types/delivery';

export const deliveryApi = {
	getCampaigns(params?: DeliveryQueryParams) {
		return http.get<PaginatedResponse<CampaignItem>>('/delivery/campaign', { params });
	},

	getCampaign(id: number) {
		return http.get<ApiResponse<CampaignItem>>(`/delivery/campaign/${id}`);
	},

	createCampaign(payload: Partial<CampaignItem>) {
		return http.post<ApiResponse<CampaignItem>>('/delivery/campaign', payload);
	},

	updateCampaign(id: number, payload: Partial<CampaignItem>) {
		return http.put<ApiResponse<CampaignItem>>(`/delivery/campaign/${id}`, payload);
	},

	deleteCampaign(id: number) {
		return http.delete<ApiResponse<{ id: number }>>(`/delivery/campaign/${id}`);
	},

	getLineItems(params?: DeliveryQueryParams) {
		return http.get<PaginatedResponse<LineItem>>('/delivery/line-item', { params });
	},

	getLineItem(id: number) {
		return http.get<ApiResponse<LineItem>>(`/delivery/line-item/${id}`);
	},

	createLineItem(payload: Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> }) {
		return http.post<ApiResponse<LineItem>>('/delivery/line-item', payload);
	},

	createBatchLineItems(items: Array<Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> }>) {
		return http.post<ApiResponse<LineItem[]>>('/delivery/line-item/batch', { items });
	},

	updateLineItem(id: number, payload: Partial<LineItem> & { venue_ids?: number[]; screen_ids?: number[]; creative_ids?: number[]; creatives?: Array<{ id: number; weight?: number }> }) {
		return http.put<ApiResponse<LineItem>>(`/delivery/line-item/${id}`, payload);
	},

	deleteLineItem(id: number) {
		return http.delete<ApiResponse<{ id: number }>>(`/delivery/line-item/${id}`);
	},

	getPlaylistPreview(params: { venue_id?: number; screen_id?: number }) {
		return http.get<ApiResponse<PlaylistPreviewData>>('/delivery/playlist/preview', { params });
	},
};

export default deliveryApi;
