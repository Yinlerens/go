import { 
  QueryClient, 
  QueryClientProvider,
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';
import { request } from './request';

/**
 * 创建查询客户端
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1分钟
        gcTime: 5 * 60 * 1000, // 5分钟
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * React Query Provider
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

/**
 * 封装的useQuery钩子，简化API调用
 * 
 * 示例用法:
 * ```tsx
 * // 获取用户列表
 * const { data, isLoading, error } = useQueryApi(
 *   ['users'], // 查询键
 *   '/api/users', // API地址
 *   {
 *     params: { page: 1, limit: 10 }, // URL参数
 *     config: { enabled: isAuthenticated } // React Query配置
 *   }
 * );
 * ```
 */
export function useQueryApi<T = any>(
  queryKey: any[],
  url: string,
  options?: { 
    params?: Record<string, any>,
    config?: Partial<UseQueryOptions<T, Error, T, any[]>>
  }
) {
  const { params, config } = options || {};
  
  // 构建URL和参数
  const fetchUrl = params 
    ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(params as any).toString()}`
    : url;
    
  return useQuery({
    queryKey,
    queryFn: () => request<T>(fetchUrl),
    ...(config || {})
  });
}

/**
 * 封装的useMutation钩子，简化API调用
 * 
 * 示例用法:
 * ```tsx
 * // 创建新用户
 * const { mutate, isPending } = useMutationApi<User, CreateUserInput>(
 *   '/api/users',
 *   {
 *     onSuccess: (data) => {
 *       // 成功回调
 *       toast.success('创建成功');
 *       queryClient.invalidateQueries({ queryKey: ['users'] });
 *     },
 *   }
 * );
 * 
 * // 调用方式
 * mutate({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function useMutationApi<TData = any, TVariables = Record<string, any>>(
  url: string,
  options?: Partial<UseMutationOptions<TData, Error, TVariables, unknown>>
) {
  return useMutation({
    mutationFn: (variables: TVariables) => request<TData>(url, { data: variables as Record<string, any> }),
    ...(options || {})
  });
}

/**
 * 用于更简单地创建查询键的工具函数
 * 
 * 示例用法:
 * ```tsx
 * const queryKey = createQueryKey('users', { id: 1 });
 * // 返回 ['users', { id: 1 }]
 * ```
 */
export function createQueryKey(base: string, params?: Record<string, any>) {
  return params ? [base, params] : [base];
} 