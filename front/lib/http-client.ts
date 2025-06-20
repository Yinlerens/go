import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { ApiResponse, ApiError } from "@/types/api";
import AuthUtils from "@/store/authStore";

const createHttpClient = () => {
  const instance: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json"
    }
  });

  const handleUnauthorized = (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
  };

  // 请求拦截器
  instance.interceptors.request.use(
    config => {
      const token = AuthUtils.getAuthHeader();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.method === "get") {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }

      return config;
    },
    error => Promise.reject(error)
  );

  // 响应拦截器
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError<ApiError>) => {
      const { response } = error;

      if (response) {
        switch (response.status) {
          case 401:
            handleUnauthorized();
            break;
          case 403:
            console.error("Access forbidden");
            break;
          case 404:
            console.error("Resource not found");
            break;
          case 500:
            console.error("Server error");
            break;
        }
      }

      return Promise.reject(error);
    }
  );

  return {
    get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await instance.get<ApiResponse<T>>(url, config);
      return response.data;
    },

    post: async <T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
      const response = await instance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    },

    put: async <T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
      const response = await instance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    },

    patch: async <T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
      const response = await instance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    },

    delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
      const response = await instance.delete<ApiResponse<T>>(url, config);
      return response.data;
    }
  };
};

export const httpClient = createHttpClient();
