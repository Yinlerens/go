import { useAuthStore } from "@/store/user-store";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
// 定义响应数据的通用类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}
// 创建 axios 实例
const service: AxiosInstance = axios.create({
  timeout: 10000,
  withCredentials: true,
  baseURL: "https://api.syuan.email/api"
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const state = useAuthStore.getState();
    const token = state.user.access_token;
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
      switch (error.response.status) {
        case 401:
          toast.error(error.response.data.message);
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
