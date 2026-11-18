import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getLoginRoutePath } from '../routes/registry';
import { getAuthToken, clearAuthToken } from '../utils/tokenStorage';

const API_BASE_URL = '/admin/api';

class ApiClient {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: API_BASE_URL,
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			timeout: 15000,
		});

		this.client.interceptors.request.use((config) => {
			const token = getAuthToken();
			if (token && config.headers) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		});

		this.client.interceptors.response.use(
			(response: AxiosResponse) => response,
			(error) => {
				if (error.response?.status === 401) {
					clearAuthToken();
					const loginPath = getLoginRoutePath();
					if (window.location.pathname !== loginPath) {
						window.location.href = loginPath;
					}
				}
				return Promise.reject(error);
			},
		);
	}

	public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.client.get<T>(url, config);
	}

	public post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.client.post<T>(url, data, config);
	}

	public put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.client.put<T>(url, data, config);
	}

	public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.client.delete<T>(url, config);
	}
}

export const http = new ApiClient();
export default http;
