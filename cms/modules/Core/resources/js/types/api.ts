export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T[];
  pagination: PaginationMeta;
}
