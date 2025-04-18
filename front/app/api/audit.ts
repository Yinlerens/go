import { request } from "@/utils/request"; // Assuming your request utility path

// ---- Model Interfaces ---- //

/**
 * 审计日志详情结构
 */
export interface AuditLog {
  id: string; // MongoDB ObjectID as string
  event_id: string;
  event_type: string;
  timestamp: string; // ISO 8601 format string (e.g., "2023-10-27T10:30:00Z")
  service_name: string;
  user_id?: string;
  username?: string;
  request_id?: string;
  client_ip?: string;
  user_agent?: string;
  request_path?: string;
  request_method?: string;
  resource_type?: string;
  resource_id?: string;
  operation?: string;
  result: string; // e.g., "success", "failure"
  details?: Record<string, any>;
  error_message?: string;
}

// ---- Request Interfaces ---- //

/**
 * 查询审计日志列表请求参数
 */
export interface ListAuditLogsRequest {
  start_time?: string; // ISO 8601 format string
  end_time?: string; // ISO 8601 format string
  user_id?: string;
  username?: string;
  event_type?: string;
  service_name?: string;
  result?: string;
  resource_type?: string;
  resource_id?: string;
  client_ip?: string;
  page?: number;
  page_size?: number;
}

/**
 * 导出审计日志请求参数
 */
interface ExportAuditLogsRequest {
  start_time?: string; // ISO 8601 format string
  end_time?: string; // ISO 8601 format string
  user_id?: string;
  username?: string;
  event_type?: string;
  service_name?: string;
  result?: string;
  format?: "csv" | "excel"; // Specify desired format
}

/**
 * 获取审计统计信息请求参数
 */
interface GetStatisticsRequest {
  start_time?: string; // ISO 8601 format string
  end_time?: string; // ISO 8601 format string
}

// ---- Response Interfaces ---- //
// Note: These interfaces represent the 'data' field in the standard Response wrapper

/**
 * 审计日志列表响应数据
 */
interface ListAuditLogsResponseData {
  list: AuditLog[];
  total: number;
}

/**
 * 按键值分组的统计项
 */
interface StatItem {
  _id: string | Record<string, any>; // Grouping key (e.g., event_type, service_name, date string, or date object parts)
  count: number;
}

/**
 * 时间序列数据点（根据后端逻辑，_id 可能是字符串或对象）
 */
interface TimeSeriesDataPoint {
  _id: string | { year: number; week: number }; // Could be formatted date string or year/week object
  count: number;
}

/**
 * 审计统计信息响应数据
 */
interface GetStatisticsResponseData {
  total_count: number;
  event_types: StatItem[]; // Array of { _id: "event_type", count: number }
  services: StatItem[]; // Array of { _id: "service_name", count: number }
  results: StatItem[]; // Array of { _id: "result", count: number }
  time_series: TimeSeriesDataPoint[]; // Array of { _id: string | object, count: number }
  time_format?: string; // Optional: Format string if time_series._id is a date string
}

/**
 * 获取事件类型响应数据
 */
interface GetEventTypesResponseData {
  event_types: string[];
}

/**
 * 获取服务名称响应数据
 */
interface GetServiceNamesResponseData {
  service_names: string[];
}

// ---- API Functions ---- //

/**
 * 获取审计日志列表
 */
export const listAuditLogs = (data: ListAuditLogsRequest) =>
  request.post<ListAuditLogsResponseData>("/audit/logs", data);

/**
 * 导出审计日志
 * 注意：这个请求通常返回文件流。
 * `request` 工具可能需要特殊处理来下载文件。
 * 返回类型 `Blob` 或 `ArrayBuffer` 可能更合适，取决于你的 `request` 工具如何处理文件下载。
 * 如果 `request` 自动处理下载并且不返回主体，则 `Promise<null>` 或 `Promise<void>` 也可以。
 */
export const exportAuditLogs = (data: ExportAuditLogsRequest) =>
  request.post<Blob>("/audit/export", data, { responseType: "blob" }); // Example: configuring response type for blob

/**
 * 获取审计统计信息
 */
export const getAuditStatistics = (data: GetStatisticsRequest) =>
  request.post<GetStatisticsResponseData>("/audit/stats", data);

/**
 * 获取所有唯一的事件类型
 */
export const getAuditEventTypes = () =>
  request.get<GetEventTypesResponseData>("/audit/event-types"); // Use GET as defined in Go routes

/**
 * 获取所有唯一服务名称
 */
export const getAuditServiceNames = () =>
  request.get<GetServiceNamesResponseData>("/audit/service-names"); // Use GET as defined in Go routes
