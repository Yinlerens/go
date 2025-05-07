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

// --- 刷新 Token 的函数---
const refreshToken = async (): Promise<string> => {
  const state = useAuthStore.getState(); // 将 state 获取提前，方便错误处理时调用 logout
  try {
    const refreshAxios = axios.create({
      baseURL: "/api",
      withCredentials: true
    });
    // 注意：refreshAxios.post 的响应类型应该符合 ApiResponse 结构
    const response = await refreshAxios.post("/refresh", {});

    // 检查业务状态码 code
    if (response.data?.data && response.data.data.code === 0) {
      const newAccessToken = response.data.data.access_token;
      if (!newAccessToken) {
        // 如果 code 为 0 但没有 token，也视为刷新失败
        console.error("Token刷新失败：响应成功但未返回access_token。响应:", response.data);
        state.logout();
        toast.error(response.data.msg || "刷新凭证失败，请重新登录");
        throw new Error(response.data.msg || "刷新凭证失败，响应中未包含新的access_token");
      }
      state.setAccessToken(newAccessToken);
      console.log("Token成功刷新.");
      return newAccessToken;
    } else {
      // 当 HTTP 状态码为 2xx 但业务 code 不为 0
      const errorMessage = response.data?.msg || "Token刷新失败，请重新登录";
      console.error("Token刷新失败，业务状态码非0:", response.data);
      state.logout(); // 清理状态
      toast.error(errorMessage);
      // 抛出错误，以便调用 refreshToken 的地方能捕获到刷新失败
      throw new Error(`Token刷新失败: ${errorMessage} (code: ${response.data?.code})`);
    }
  } catch (error: any) {
    // 这个 catch 块会捕获 refreshAxios.post 请求本身的错误 (如网络错误，5xx 错误)
    // 或者上面 throw new Error 的情况
    console.error("Token刷新请求异常或处理失败:", error);
    state.logout(); // 确保在任何刷新失败的情况下都登出

    // 如果错误是 Error 实例并且有 message，优先使用它的 message
    // 否则，如果是 axios 错误且有后端返回的 msg，尝试使用
    let toastMessage = "状态过期，请重新登录";
    if (error instanceof Error && error.message && !error.message.startsWith("Token刷新失败:")) {
      // 如果不是我们自定义的 "Token刷新失败:" 开头的错误，可能是网络层或其他axios错误
      // 对于我们自定义的错误，toast已经在上面处理过了
    } else if (error.response?.data?.msg) {
      toastMessage = error.response.data.msg;
    } else if (error.message) {
      // 捕获我们自定义的 throw new Error 的信息
      toastMessage = error.message;
    }

    // 避免重复 toast 由上面  if (response.data && response.data.code === 0) else 分支已弹出的信息
    if (!toastMessage.includes("Token刷新失败:")) {
      toast.error(toastMessage);
    }

    // 确保抛出的是一个 Error 对象，以便上层拦截器可以正确处理
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error) || "未知的Token刷新错误");
    }
  }
};

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  timeout: 10000,
  withCredentials: true,
  baseURL: "/api"
});

// 请求拦截器
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
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res: any = response.data;
    if (res.code !== 0) {
      toast.error(res.msg || "请求失败");
    }
    return res;
  },
  async error => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest.url !== "/refresh" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            originalRequest._retry = true;
            return service(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshToken();
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        return service(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response) {
      const data = error.response.data;
      const status = error.response.status;
      const message = data?.message || data?.msg || error.message;

      switch (status) {
        case 401:
          toast.error(message || "未授权访问或会话已过期。"); // 修改点
          // useAuthStore.getState().logout(); // 根据需要取消注释
          break;
        case 403:
          toast.error(message || "禁止访问。"); // 修改点
          console.error("禁止访问:", error.response); // 修改点
          break;
        case 404:
          toast.error(message || "未找到资源。"); // 修改点
          console.error("未找到:", error.response); // 修改点
          break;
        case 500:
          toast.error(message || "服务器错误。"); // 修改点
          console.error("服务器错误:", error.response); // 修改点
          break;
        default:
          toast.error(message || `错误: ${status}`); // 修改点
          console.error(`未处理的 HTTP 错误 ${status}:`, error.response); // 修改点
      }
      return Promise.reject(error);
    } else if (error.request) {
      toast.error("网络错误：未收到响应。"); // 修改点
      console.error("网络错误:", error.request); // 修改点
    } else {
      toast.error("请求设置错误。"); // 修改点
      console.error("请求设置错误:", error.message); // 修改点
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
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
