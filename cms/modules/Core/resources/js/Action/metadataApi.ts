import http from './api';
import type { ApiResponse } from '../types/api';
import type { CmsMetadata, MetadataQueryParams } from '../types/metadata';

export const metadataApi = {
	getMetadata: (params?: MetadataQueryParams) => {
		const queryParams = params?.keys
			? { keys: Array.isArray(params.keys) ? params.keys.join(',') : params.keys }
			: undefined;

		return http.get<ApiResponse<CmsMetadata>>('/core/metadata', { params: queryParams });
	},
};

export default metadataApi;
