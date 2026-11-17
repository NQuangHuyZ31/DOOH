import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ROUTING_CONFIG } from '../configs/routing';
import { getAuthToken, clearAuthToken } from '../utils/tokenStorage';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ROUTING_CONFIG.apiPrefix,
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
          if (window.location.pathname !== ROUTING_CONFIG.auth.loginPath) {
            window.location.href = ROUTING_CONFIG.auth.loginPath;
          }
        }
        return Promise.reject(error);
      }
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
