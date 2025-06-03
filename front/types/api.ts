// API响应基础类型
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  code: number;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API错误类型
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}
