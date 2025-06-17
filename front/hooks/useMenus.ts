import { useApiQuery, useApiMutation, useApiInfiniteQuery } from "./use-api-query";
import { httpClient } from "@/lib/http-client";
import { 
  Menu, 
  MenuTreeNode, 
  MenuStats, 
  CreateMenuRequest, 
  UpdateMenuRequest, 
  MenuQueryParams 
} from "@/types/menu";
import { PaginatedResponse } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// 菜单查询相关的查询键
export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (params: MenuQueryParams) => [...menuKeys.lists(), params] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
  tree: () => [...menuKeys.all, 'tree'] as const,
  stats: () => [...menuKeys.all, 'stats'] as const,
};

// 获取菜单列表
export function useMenus(params: MenuQueryParams = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  return useApiQuery<PaginatedResponse<Menu>>(
    menuKeys.list(params),
    `/menus?${queryParams.toString()}`,
    {},
    {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000, // 10分钟
    }
  );
}

// 无限滚动获取菜单列表
export function useInfiniteMenus(params: Omit<MenuQueryParams, 'page'> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  return useApiInfiniteQuery<Menu>(
    [...menuKeys.lists(), 'infinite', params],
    `/menus?${queryParams.toString()}`,
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

// 获取单个菜单详情
export function useMenu(id: string, enabled: boolean = true) {
  return useApiQuery<Menu>(
    menuKeys.detail(id),
    `/menus/${id}`,
    {},
    {
      enabled: enabled && !!id,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

// 获取菜单树形结构
export function useMenuTree(includeHidden: boolean = false, includeDisabled: boolean = false) {
  const queryParams = new URLSearchParams();
  if (includeHidden) queryParams.append('includeHidden', 'true');
  if (includeDisabled) queryParams.append('includeDisabled', 'true');

  return useApiQuery<MenuTreeNode[]>(
    [...menuKeys.tree(), { includeHidden, includeDisabled }],
    `/menus/tree?${queryParams.toString()}`,
    {},
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

// 获取菜单统计信息
export function useMenuStats() {
  return useApiQuery<MenuStats>(
    menuKeys.stats(),
    '/menus/stats',
    {},
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

// 创建菜单
export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useApiMutation<Menu, CreateMenuRequest>(
    (data) => httpClient.post('/menus', data),
    {
      onSuccess: (response) => {
        // 使相关查询失效
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
        toast.success(response.message || '菜单创建成功');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || '创建菜单失败';
        toast.error(message);
      }
    }
  );
}

// 更新菜单
export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useApiMutation<Menu, UpdateMenuRequest>(
    (data) => httpClient.put(`/menus/${data.id}`, data),
    {
      onSuccess: (response, variables) => {
        // 使相关查询失效
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
        // 更新特定菜单的缓存
        queryClient.setQueryData(menuKeys.detail(variables.id), response);
        toast.success(response.message || '菜单更新成功');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || '更新菜单失败';
        toast.error(message);
      }
    }
  );
}

// 删除菜单
export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useApiMutation<null, string>(
    (id) => httpClient.delete(`/menus/${id}`),
    {
      onSuccess: (response) => {
        // 使相关查询失效
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
        toast.success(response.message || '菜单删除成功');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || '删除菜单失败';
        toast.error(message);
      }
    }
  );
}

// 批量删除菜单
export function useBatchDeleteMenus() {
  const queryClient = useQueryClient();

  return useApiMutation<null, string[]>(
    async (ids) => {
      // 并行删除所有菜单
      const promises = ids.map(id => httpClient.delete(`/menus/${id}`));
      await Promise.all(promises);
      return { data: null, message: '批量删除成功', code: 200, success: true };
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: menuKeys.all });
        toast.success(response.message || '批量删除成功');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || '批量删除失败';
        toast.error(message);
      }
    }
  );
}
