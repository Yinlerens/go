// lib/rbac.ts - RBAC API接口封装
import { request } from "@/utils/request";

// 角色管理API
// -------------------------------------------------

// 创建角色
interface CreateRoleRequest {
  role_key: string;
  name: string;
  description?: string;
}

interface CreateRoleResponse {
  role_key: string;
  name: string;
  description?: string;
}

export const createRole = (data: CreateRoleRequest) =>
  request.post<CreateRoleResponse>("/rbac/roles/create", data);

// 获取角色列表
interface ListRolesRequest {
  page?: number;
  page_size?: number;
}

interface Role {
  role_key: string;
  name: string;
  description?: string;
}

interface ListRolesResponse {
  list: Role[];
  total: number;
}

export const listRoles = (data: ListRolesRequest = {}) =>
  request.post<ListRolesResponse>("/rbac/roles/list", data);

// 更新角色
interface UpdateRoleRequest {
  role_key: string;
  name?: string;
  description?: string;
}

export const updateRole = (data: UpdateRoleRequest) =>
  request.post<null>("/rbac/roles/update", data);

// 删除角色
interface DeleteRoleRequest {
  role_key: string;
}

export const deleteRole = (data: DeleteRoleRequest) =>
  request.post<null>("/rbac/roles/delete", data);

// 权限管理API
// -------------------------------------------------

// 创建权限
interface CreatePermissionRequest {
  permission_key: string;
  name: string;
  type: string;
  description?: string;
}

interface CreatePermissionResponse {
  permission_key: string;
  name: string;
  type: string;
  description?: string;
}

export const createPermission = (data: CreatePermissionRequest) =>
  request.post<CreatePermissionResponse>("/rbac/permissions/create", data);

// 获取权限列表
interface ListPermissionsRequest {
  page?: number;
  page_size?: number;
  type?: string;
}

interface Permission {
  permission_key: string;
  name: string;
  type: string;
  description?: string;
}

interface ListPermissionsResponse {
  list: Permission[];
  total: number;
}

export const listPermissions = (data: ListPermissionsRequest = {}) =>
  request.post<ListPermissionsResponse>("/rbac/permissions/list", data);

// 更新权限
interface UpdatePermissionRequest {
  permission_key: string;
  name?: string;
  type?: string;
  description?: string;
}

export const updatePermission = (data: UpdatePermissionRequest) =>
  request.post<null>("/rbac/permissions/update", data);

// 删除权限
interface DeletePermissionRequest {
  permission_key: string;
}

export const deletePermission = (data: DeletePermissionRequest) =>
  request.post<null>("/rbac/permissions/delete", data);

// 角色-权限关联API
// -------------------------------------------------

// 给角色分配权限
interface AssignPermissionRequest {
  role_key: string;
  permission_keys: string[];
}

export const assignPermission = (data: AssignPermissionRequest) =>
  request.post<null>("/rbac/roles/assign-permission", data);

// 解除角色权限
interface UnassignPermissionRequest {
  role_key: string;
  permission_keys: string[];
}

export const unassignPermission = (data: UnassignPermissionRequest) =>
  request.post<null>("/rbac/roles/unassign-permission", data);

// 获取角色权限
interface GetRolePermissionsRequest {
  role_key: string;
}

interface GetRolePermissionsResponse {
  permissions: Permission[];
}

export const getRolePermissions = (data: GetRolePermissionsRequest) =>
  request.post<GetRolePermissionsResponse>("/rbac/roles/permissions", data);

// 用户-角色关联API
// -------------------------------------------------

// 给用户分配角色
interface AssignRoleRequest {
  user_id: string;
  role_keys: string[];
}

export const assignRole = (data: AssignRoleRequest) =>
  request.post<null>("/rbac/users/assign-role", data);

// 解除用户角色
interface UnassignRoleRequest {
  user_id: string;
  role_keys: string[];
}

export const unassignRole = (data: UnassignRoleRequest) =>
  request.post<null>("/rbac/users/unassign-role", data);

// 获取用户角色
interface GetUserRolesRequest {
  user_id: string;
}

interface GetUserRolesResponse {
  roles: Role[];
}

export const getUserRoles = (data: GetUserRolesRequest) =>
  request.post<GetUserRolesResponse>("/rbac/users/roles", data);

// 权限检查API
// -------------------------------------------------

// 检查用户权限
interface CheckPermissionRequest {
  user_id: string;
  permission_key: string;
}

interface CheckPermissionResponse {
  allowed: boolean;
}

export const checkPermission = (data: CheckPermissionRequest) =>
  request.post<CheckPermissionResponse>("/rbac/check", data);

// 获取用户权限列表
interface GetUserPermissionsRequest {
  user_id: string;
  type?: string;
}

interface GetUserPermissionsResponse {
  permissions: Permission[];
}

export const getUserPermissions = (data: GetUserPermissionsRequest) =>
  request.post<GetUserPermissionsResponse>("/rbac/users/permissions", data);

// 审计日志API
// -------------------------------------------------

// 获取审计日志
interface ListAuditLogsRequest {
  page?: number;
  page_size?: number;
  filters?: {
    actor_id?: string;
    actor_type?: string;
    action?: string;
    target_type?: string;
    target_key?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
  };
}

interface AuditLog {
  id: number;
  timestamp: string;
  actor_id: string;
  actor_type: string;
  action: string;
  target_type?: string;
  target_key?: string;
  details?: any;
  status: string;
  error_message?: string;
}

interface ListAuditLogsResponse {
  list: AuditLog[];
  total: number;
}

export const listAuditLogs = (data: ListAuditLogsRequest = {}) =>
  request.post<ListAuditLogsResponse>("/rbac/audit-logs/list", data);
