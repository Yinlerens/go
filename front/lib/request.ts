import { toast } from 'sonner';

/**
 * 基础请求配置类型
 */
interface RequestOptions extends RequestInit {
  data?: Record<string, any>;
}

/**
 * 请求响应类型
 */
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * 通用请求函数
 * @param url 请求地址
 * @param options 请求选项
 * @returns 响应数据
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, ...customConfig } = options;
  
  // 默认请求配置
  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...customConfig,
  };

  // 如果有请求体数据，转换为JSON字符串
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    // 处理非200响应
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `请求错误: ${response.status}`);
    }
    
    const result = await response.json() as ApiResponse<T>;
    
    // 处理业务逻辑错误
    if (result.code !== 0 && result.code !== 200) {
      throw new Error(result.message || '请求失败');
    }
    
    return result.data;
  } catch (error) {
    // 全局错误处理
    const message = error instanceof Error ? error.message : '网络请求失败';
    toast.error(message);
    throw error;
  }
}

/**
 * GET请求快捷方法
 */
export function get<T = any>(url: string, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'GET' });
}

/**
 * POST请求快捷方法
 */
export function post<T = any>(url: string, data?: Record<string, any>, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'POST', data });
}

/**
 * PUT请求快捷方法
 */
export function put<T = any>(url: string, data?: Record<string, any>, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'PUT', data });
}

/**
 * DELETE请求快捷方法
 */
export function del<T = any>(url: string, data?: Record<string, any>, options?: RequestOptions) {
  return request<T>(url, { ...options, method: 'DELETE', data });
} 