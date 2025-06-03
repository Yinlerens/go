import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  QueryKey
} from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { AxiosError, AxiosRequestConfig } from "axios";

// 通用查询Hook
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  url: string,
  config?: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, AxiosError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey,
    queryFn: () => httpClient.get<TData>(url, config),
    ...options
  });
}

// 通用Mutation Hook
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, AxiosError, TVariables>
) {
  return useMutation({
    mutationFn,
    ...options
  });
}

// 无限查询Hook（用于分页）
export function useApiInfiniteQuery<TData = unknown>(
  queryKey: QueryKey,
  url: string,
  options?: Omit<
    UseInfiniteQueryOptions<ApiResponse<PaginatedResponse<TData>>, AxiosError>,
    "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
  >
) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      httpClient.get<PaginatedResponse<TData>>(url, {
        params: { page: pageParam }
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const currentPage = pages.length;
      const totalPages = lastPage.data.totalPages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    ...options
  });
}
