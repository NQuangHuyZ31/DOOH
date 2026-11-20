import http from './api';
import type { ApiResponse } from '../types/api';

export interface UploadResponseData {
	url: string;
	path: string;
	original_name: string;
	file_size: number;
	mime_type: string;
	extension: string;
}

export const uploadApi = {
	uploadFile(file: File, folder: string = 'general', onProgress?: (percent: number) => void) {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('folder', folder);

		return http.post<ApiResponse<UploadResponseData>>('/core/upload', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
			onUploadProgress: (progressEvent) => {
				if (onProgress && progressEvent.total) {
					const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(percent);
				}
			},
		});
	},
};

export default uploadApi;
