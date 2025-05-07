import { useAuthStore } from "@/store/user-store";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";
import { toast } from "sonner";

// 定义响应数据的通用类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// --- 新增部分：用于管理刷新状态和请求队列 ---
let isRefreshing = false; // 标记是否正在刷新 token
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = []; // 存储因 token 失效而失败的请求

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error); // 如果刷新失败，拒绝队列中的所有请求
    } else {
      prom.resolve(token); // 如果刷新成功，用新 token resolve
    }
  });
  failedQueue = []; // 清空队列
};

// --- 刷新 Token 的函数 (需要根据你的 API 实现) ---
const refreshToken = async (): Promise<string> => {
  try {
    const refreshAxios = axios.create({
      baseURL: "/api", // 保持 baseURL 一致可能更好
      withCredentials: true // 明确设置以确保发送 Cookie
    });
    const response = await refreshAxios.post("/refresh", {});

    const newAccessToken = response.data.data.access_token;
    const state = useAuthStore.getState();
    state.setAccessToken(newAccessToken);
    console.log("Token成功刷新.");
    return newAccessToken;
  } catch (error) {
    console.error("token刷新失败:", error);
    const state = useAuthStore.getState();
    state.logout(); // 清理状态
    toast.error("状态过期，请重新登录");
    throw error;
  }
};

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  timeout: 10000,
  withCredentials: true,
  baseURL: "/api"
});

// 请求拦截器 (保持不变)
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = useAuthStore.getState();
    const token = state.access_token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器 (修改错误处理逻辑)
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res: any = response.data;
    // 假设 code 为 0 代表成功
    if (res.code !== 0) {
      toast.error(res.msg || "Request failed"); // 使用 res.msg，如果没有提供则显示默认消息
    }
    // 注意：调用者需要检查 res.code 来判断业务是否成功
    return res;
  },
  async error => {
    // 将错误处理函数标记为 async
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }; // 获取原始请求配置，并添加重试标记类型

    // 检查是否是 401 错误，并且不是刷新 token 请求本身失败 (如果刷新 API 也可能返回 401)
    // 同时检查请求是否已经是重试请求，防止无限循环
    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/refresh" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // 如果正在刷新 token，将当前失败的请求加入队列等待
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            // 等待刷新成功后，用新的 token 重试请求
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            originalRequest._retry = true; // 标记为重试请求
            return service(originalRequest); // 使用 service 重新发起请求
          })
          .catch(err => {
            // 如果等待过程中刷新失败了，返回错误
            return Promise.reject(err);
          });
      }

      // 标记正在刷新
      isRefreshing = true;
      originalRequest._retry = true; // 标记为重试请求，防止因网络波动等原因导致死循环刷新

      try {
        const newAccessToken = await refreshToken(); // 调用刷新 token 的函数
        processQueue(null, newAccessToken); // 刷新成功，处理队列中的请求

        // 更新当前失败请求的 token 并重试
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        return service(originalRequest); // 使用 service 重新发起请求
      } catch (refreshError) {
        processQueue(refreshError, null); // 刷新失败，拒绝队列中的所有请求
        // logout() 应该在 refreshToken 内部处理了
        return Promise.reject(refreshError); // 返回刷新失败的错误
      } finally {
        isRefreshing = false; // 重置刷新状态
      }
    } else if (error.response) {
      // 处理其他 HTTP 错误 (如 403, 404, 500 等)
      const data = error.response.data;
      const status = error.response.status;
      const message = data?.message || data?.msg || error.message; // 尝试获取后端错误信息

      switch (status) {
        // 401 错误如果不是因为 token 过期（例如，直接访问未授权资源），或者刷新失败后，最终会走到这里
        case 401:
          // 可能是刷新失败后被 reject，或者是不应该刷新的 401
          toast.error(message || "Unauthorized access or session expired.");
          // 可以在这里触发登出逻辑（如果 refreshToken 函数没处理的话）
          // useAuthStore.getState().logout();
          break;
        case 403:
          toast.error(message || "Forbidden.");
          console.error("Forbidden", error.response);
          break;
        case 404:
          toast.error(message || "Resource not found.");
          console.error("Not Found", error.response);
          break;
        case 500:
          toast.error(message || "Server Error.");
          console.error("Server Error", error.response);
          break;
        default:
          toast.error(message || `Error: ${status}`);
          console.error(`Unhandled HTTP Error ${status}`, error.response);
      }
      // 返回原始错误，让调用方也能 catch 到
      return Promise.reject(error);
    } else if (error.request) {
      // 请求已发出，但没有收到响应 (例如网络错误)
      toast.error("Network Error: No response received.");
      console.error("Network Error:", error.request);
    } else {
      // 设置请求时触发了一个错误
      toast.error("Request Setup Error");
      console.error("Request Setup Error:", error.message);
    }

    // 对于非 HTTP 响应错误（网络错误、请求设置错误）或未处理的 HTTP 错误，也 reject
    return Promise.reject(error);
  }
);

// 封装请求方法 (保持不变)
const request = {
  get: <T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.get(url, { params, ...config });
  },
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.post(url, data, config);
  }
  // 可以添加 put, delete 等方法
};

export { service, request };
