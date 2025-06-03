import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // TanStack Query v5的新配置
      gcTime: 1000 * 60 * 60 * 24, // 24小时（之前是cacheTime）
      staleTime: 1000 * 60 * 5, // 5分钟
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 自定义重试逻辑
        if (error instanceof AxiosError) {
          // 不重试4xx错误
          if (
            error.response?.status &&
            error.response.status >= 400 &&
            error.response.status < 500
          ) {
            return false;
          }
        }
        return failureCount < 3;
      }
    },
    mutations: {
      retry: false
    }
  }
});
