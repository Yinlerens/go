import {
  useQuery,
  UseQueryOptions,
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { httpClient } from '@/lib/http-client';
import { ApiResponse } from '@/types/api';
import { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * 通用的 React Query 查询 Hook，封装了 httpClient.get 请求。
 * 它是应用中所有“读”操作的基础。
 *
 * @template TData - 预期从 API 返回的数据类型 (e.g., User, Product[])。
 * @param {QueryKey} queryKey - 用于缓存和识别此查询的唯一键。
 * **重要**: 此 key 应该包含所有会影响查询结果的依赖项，例如 ID、筛选条件等。
 * 例如: `['users', { page: 1, status: 'active' }]`
 * @param {string} url - 请求的 URL 地址。
 * @param {AxiosRequestConfig} [config] - 可选的 Axios 请求配置，常用于传递查询参数 `params`。
 * 例如: `{ params: { page: 1, limit: 10 } }`
 * @param {Omit<UseQueryOptions<ApiResponse<TData>, AxiosError>, "queryKey" | "queryFn">} [options] -
 * 可选的 React Query `useQuery` 配置项，用于覆盖默认行为 (e.g., `enabled`, `staleTime`)。
 * @returns 返回 React Query 的 `useQuery` 的所有结果，包括 `data`, `isLoading`, `isError` 等。
 * 注意：返回的 `data` 是后端返回的完整 `ApiResponse<TData>` 结构，你需要在使用时解构，例如 `data?.data`。
 */
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<
    UseQueryOptions<ApiResponse<TData>, AxiosError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    // queryKey 由调用方提供，包含了所有依赖项
    queryKey,
    // queryFn 封装了实际的请求逻辑
    queryFn: () => httpClient.get<TData>(url, config),
    // 其他所有 useQuery 的配置项
    ...options,
  });
}
/**
 * 通用的 React Query 变更 Hook，封装了 httpClient 的 CUD (Create, Update, Delete) 操作。
 * 它是应用中所有“写”操作的基础。
 *
 * @template TData - 变更成功后，API 返回的数据类型。
 * @template TVariables - 调用 `mutate` 函数时，需要传入的变量类型 (e.g., 表单数据)。默认为 `void`。
 * @param {string | ((variables: TVariables) => string)} url - 请求的 URL。
 * 可以是一个静态字符串，也可以是一个函数，用于根据输入变量动态生成 URL (e.g., for "update" or "delete" a specific item)。
 * 例如: `(vars) => \`/api/users/${vars.id}\``
 * @param {'post' | 'put' | 'patch' | 'delete'} method - HTTP 请求方法。
 * @param {Omit<UseMutationOptions<ApiResponse<TData>, AxiosError, TVariables>, "mutationFn">} [options] -
 * React Query 的 `useMutation` 配置项，例如 `onSuccess` (用于作废查询), `onError`。
 * @returns 返回 React Query 的 `useMutation` 的所有结果，包括 `mutate`, `isPending` 等。
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  url: string | ((variables: TVariables) => string),
  method: 'post' | 'put' | 'patch' | 'delete',
  options?: Omit<
    UseMutationOptions<ApiResponse<TData>, AxiosError, TVariables>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: (variables: TVariables) => {
      // 如果 url 是一个函数，就用它来动态生成请求地址
      const requestUrl = typeof url === 'function' ? url(variables) : url;

      // 根据 method 调用对应的 httpClient 方法
      switch (method) {
        case 'post':
          // 对于 post, put, patch，variables 通常是请求体
          return httpClient.post<TData>(requestUrl, variables);
        case 'put':
          return httpClient.put<TData>(requestUrl, variables);
        case 'patch':
          return httpClient.patch<TData>(requestUrl, variables);
        case 'delete':
          // 对于 delete，通常没有请求体，variables 用于生成 URL
          return httpClient.delete<TData>(requestUrl);
      }
    },
    // 传入所有其他的 useMutation 配置
    ...options,
  });
}
