// Type definitions for menu data

// Menu node structure
export interface MenuNode {
  id: string;
  name: string;
  path: string;
  icon: string;
  permission_key?: string;
  parent_id: string | null;
  order: number;
  is_enabled: boolean;
  meta?: Record<string, any>;
  children: MenuNode[];
}

// User menu structure (filtered by permissions)
export interface UserMenuNode {
  id: string;
  name: string;
  path: string;
  icon: string;
  parent_id: string | null;
  order: number;
  meta?: Record<string, any>;
  children: UserMenuNode[];
}

// Menu change log
export interface MenuLog {
  id: number;
  menu_id: string;
  action: string;
  operator_id: string;
  operator_type: string;
  before_change: Record<string, any> | null;
  after_change: Record<string, any> | null;
  created_at: string;
}

// Request types
export interface GetUserMenuRequest {
  user_id: string;
}

export interface CreateMenuItemRequest {
  name: string;
  path: string;
  icon?: string;
  permission_key?: string;
  parent_id?: string | null;
  order?: number;
  is_enabled?: boolean;
  meta?: Record<string, any>;
}

export interface UpdateMenuItemRequest {
  id: string;
  name: string;
  path: string;
  icon?: string;
  permission_key?: string;
  parent_id?: string | null;
  order?: number;
  is_enabled?: boolean;
  meta?: Record<string, any>;
}

export interface DeleteMenuItemRequest {
  id: string;
}

export interface UpdateMenuPermissionRequest {
  id: string;
  permission_key?: string;
}

export interface ListMenuLogsRequest {
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

// Response types
export interface BaseResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface GetUserMenuResponse {
  items: UserMenuNode[];
}

export interface GetMenuTreeResponse {
  items: MenuNode[];
}

export interface CreateMenuItemResponse {
  id: string;
  name: string;
  path: string;
  icon: string;
  permission_key: string;
  parent_id: string | null;
  order: number;
  is_enabled: boolean;
  meta: Record<string, any>;
}

export interface ListMenuLogsResponse {
  list: MenuLog[];
  total: number;
}
