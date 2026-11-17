import { http } from '@core/Action/api';

export interface VenueItem {
  id: number;
  code: string;
  name: string;
  location: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  secret_key?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
}

export const venueApi = {
  getVenues: (params?: { page?: number; per_page?: number }) =>
    http.get<{ data: VenueItem[]; pagination: any }>('/venue', { params }),

  getVenue: (id: number | string) =>
    http.get<{ data: VenueItem }>(`/venue/${id}`),

  createVenue: (data: Partial<VenueItem>) =>
    http.post<{ data: VenueItem }>('/venue', data),

  updateVenue: (id: number | string, data: Partial<VenueItem>) =>
    http.put(`/venue/${id}`, data),

  deleteVenue: (id: number | string) =>
    http.delete(`/venue/${id}`),
};

export default venueApi;
