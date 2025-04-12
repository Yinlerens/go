import { request } from "@/utils/request";

// 菜单节点类型定义
interface MenuNode {
  id: string;
  name: string;
  path: string;
  icon: string;
  permission_key?: string;
  parent_id: string;
  order: number;
  is_enabled: boolean;
  meta?: Record<string, any>;
  children: MenuNode[];
}

// 用户菜单节点类型定义
interface UserMenuNode {
  id: string;
  name: string;
  path: string;
  icon: string;
  parent_id: string;
  order: number;
  meta?: Record<string, any>;
  children: UserMenuNode[];
}

// 菜单变更日志类型定义
interface MenuLog {
  id: number;
  menu_id: string;
  action: string;
  operator_id: string;
  operator_type: string;
  before_change: Record<string, any> | null;
  after_change: Record<string, any> | null;
  created_at: string;
}

// ---- 请求接口 ---- //

// 获取用户菜单请求参数
interface GetUserMenuRequest {
  user_id: string;
}

// 创建菜单请求参数
interface CreateMenuItemRequest {
  name: string;
  path: string;
  icon?: string;
  permission_key?: string;
  parent_id?: string;
  order?: number;
  is_enabled?: boolean;
  meta?: Record<string, any>;
}

// 更新菜单请求参数
interface UpdateMenuItemRequest {
  id: string;
  name: string;
  path: string;
  icon?: string;
  permission_key?: string;
  parent_id?: string;
  order?: number;
  is_enabled?: boolean;
  meta?: Record<string, any>;
}

// 删除菜单请求参数
interface DeleteMenuItemRequest {
  id: string;
}

// 更新菜单权限请求参数
interface UpdateMenuPermissionRequest {
  id: string;
  permission_key?: string;
}

// 查询菜单日志请求参数
interface ListMenuLogsRequest {
  page?: number;
  page_size?: number;
  filters?: {
    menu_id?: string;
    action?: string;
    operator_id?: string;
    operator_type?: string;
    start_time?: string;
    end_time?: string;
  };
}

// ---- 响应接口 ---- //

// 获取用户菜单响应
interface GetUserMenuResponse {
  items: UserMenuNode[];
}

// 获取菜单树响应
interface GetMenuTreeResponse {
  items: MenuNode[];
}

// 创建菜单响应
interface CreateMenuItemResponse {
  id: string;
  name: string;
  path: string;
  icon: string;
  permission_key: string;
  parent_id: string;
  order: number;
  is_enabled: boolean;
  meta: Record<string, any>;
}

// 菜单日志列表响应
interface ListMenuLogsResponse {
  list: MenuLog[];
  total: number;
}

// ---- API 函数 ---- //

// 获取用户菜单
export const getUserMenu = (data: GetUserMenuRequest) =>
  request.post<GetUserMenuResponse>("/menu/user-menu", data);

// 获取菜单树
export const getMenuTree = () => request.post<GetMenuTreeResponse>("/menu/items/tree", {});

// 创建菜单
export const createMenuItem = (data: CreateMenuItemRequest) =>
  request.post<CreateMenuItemResponse>("/menu/items/create", data);

// 更新菜单
export const updateMenuItem = (data: UpdateMenuItemRequest) =>
  request.post<null>("/menu/items/update", data);

// 删除菜单
export const deleteMenuItem = (data: DeleteMenuItemRequest) =>
  request.post<null>("/menu/items/delete", data);

// 更新菜单权限
export const updateMenuPermission = (data: UpdateMenuPermissionRequest) =>
  request.post<null>("/menu/items/update-permission", data);

// 获取菜单变更日志
export const listMenuLogs = (data: ListMenuLogsRequest) =>
  request.post<ListMenuLogsResponse>("/menu/logs/list", data);
