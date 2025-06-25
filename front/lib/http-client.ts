import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from 'axios';
import { ApiResponse } from '@/types/api';
import AuthUtils from '@/store/authStore';
import { userApi } from '@/services/api/users';

type Subscriber = (token: string) => void;
let subscribers: Subscriber[] = [];
let isRefreshing = false; // 状态锁，防止重复刷新

// 将暂存的请求重新发送
function onRefreshed(token: string) {
  subscribers.forEach(callback => callback(token));
  subscribers = []; // 清空队列
}

// 添加请求到队列
function addSubscriber(callback: Subscriber) {
  subscribers.push(callback);
}

const createHttpClient = () => {
  const instance: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器 (保持不变)
  instance.interceptors.request.use(
    config => {
      // 检查头部，防止在刷新token时使用旧的header
      if (!config.headers.Authorization) {
        const token = AuthUtils.getAuthHeader();
        if (token && AuthUtils.getAuthState().isAuthenticated) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const res = response.data;
      if (res.code !== 200) {
        return Promise.reject(res);
      }
      return response;
    },
    async (error: AxiosError<ApiResponse>) => {
      const { config, response } = error;

      // 确保 response 和 config 存在
      if (!response || !config) {
        console.error('网络错误或请求超时: ', error.message);
        return Promise.reject(error);
      }

      // 只处理 401 错误
      if (response.status !== 401) {
        return Promise.reject(error);
      }

      const data = response.data;

      // Case 1: 无 token 或 token 格式错误等，直接跳转登录
      if (data && data.code === 1001) {
        console.log('无有效凭证, 跳转登录页');
        AuthUtils.getAuthState().clearAuth();
        // 建议使用路由实例进行跳转，例如：router.push('/login');
        // window.location.href = '/login';
        return Promise.reject(error);
      }

      // Case 2: Access Token 过期，需要刷新
      if (data && data.code === 1002) {
        // 如果正在刷新中，则将当前失败的请求暂存起来
        if (isRefreshing) {
          return new Promise(resolve => {
            // 这个函数会在 token 刷新后被调用
            addSubscriber(newToken => {
              config.headers.Authorization = `Bearer ${newToken}`;
              // 重新发起原来的请求
              resolve(instance(config));
            });
          });
        }

        // 如果是第一个触发刷新的请求
        isRefreshing = true;
        try {
          // ⚠️ **重要提示**: 刷新 token 的请求不应该使用带有拦截器的实例，
          // 否则会陷入无限循环。userApi.refreshToken 内部应使用一个“干净”的 axios 实例。
          // 如果 userApi 也是用 httpClient 创建的，这里会死循环！
          // 假设 userApi.refreshToken 内部处理了这个问题。
          const refreshResponse = await userApi.refreshToken();

          const newAuthInfo = refreshResponse.data; // 假设返回 { token: '...', refreshToken: '...' }
          AuthUtils.getAuthState().setAccessToken(newAuthInfo.accessToken);

          // 刷新成功，重新执行队列中所有暂存的请求
          onRefreshed(newAuthInfo.accessToken);

          // 刷新成功后，也要把当前这个失败的请求重新发一次
          config.headers.Authorization = `Bearer ${newAuthInfo.accessToken}`;
          return instance(config);
        } catch (refreshError) {
          // 如果刷新 token 也失败了，说明 refresh token 也过期了
          console.error('刷新 Token 失败, 清除凭证并跳转登录页', refreshError);
          AuthUtils.getAuthState().clearAuth();
          // window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 其他 401 错误
      return Promise.reject(error);
    }
  );

  // 返回封装好的请求方法
  return {
    get: async <T = any>(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
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
    // ... put, patch, delete 方法保持不变
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
    delete: async <T = any>(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> => {
      const response = await instance.delete<ApiResponse<T>>(url, config);
      return response.data;
    },
  };
};

export const httpClient = createHttpClient();
