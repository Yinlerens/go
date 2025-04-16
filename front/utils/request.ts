import { useAuthStore } from "@/store/user-store";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
// 定义响应数据的通用类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;
const RBAC_API_URL = process.env.NEXT_PUBLIC_RBAC_API_URL;
const MENU_API_URL = process.env.NEXT_PUBLIC_MENU_API_URL;
const AUDIT_API_URL = process.env.NEXT_PUBLIC_AUDIT_API_URL;
// 创建 axios 实例
const service: AxiosInstance = axios.create({
  timeout: 10000,
  withCredentials: true
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const state = useAuthStore.getState();
    const token = state.user.access_token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // if (state.user.user_id) {
    //   config.headers["X-User-ID"] = state.user.user_id;
    // }
    // if (state.user.username) {
    //   config.headers["X-Username"] = state.user.username;
    // }
    const url = config.url || "";
    if (url.includes("/rbac/")) {
      config.baseURL = RBAC_API_URL;
    } else if (url.includes("/auth/") || url.includes("/users/")) {
      config.baseURL = AUTH_API_URL;
    } else if (url.includes("/menu/")) {
      config.baseURL = MENU_API_URL;
    } else if (url.includes("/audit/")) {
      config.baseURL = AUDIT_API_URL;
    }
    console.log("%c [ config ]-45", "font-size:13px; background:pink; color:#bf2c9f;", config);

    return config;
  },
  error => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res: any = response.data;
    if (res.code !== 0) {
      toast.error(res.msg);
    }
    return res;
  },
  error => {
    if (error.response) {
      toast.error(error.response.data.error);
      switch (error.response.status) {
        case 401:
          console.error("401");
          break;
        case 403:
          console.error("Forbidden");
          break;
        case 404:
          console.error("Not Found");
          break;
        case 500:
          console.error("Server Error");
          break;
        default:
          console.error("Unknown error");
      }
      return Promise.reject(error);
    }
  }
);

// 封装请求方法，使用泛型约束返回数据的类型
const request = {
  get: <T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.get(url, { params, ...config });
  },
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return service.post(url, data, config);
  }
};

export { service, request };
