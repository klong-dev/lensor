export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta?: PaginationMeta;
}
