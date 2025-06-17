// 菜单类型定义
export interface Menu {
  id: string;
  name: string;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  title: string;
  subtitle?: string | null;
  parentId?: string | null;
  level: number;
  sort: number;
  type: MenuType;
  target: MenuTarget;
  isVisible: boolean;
  isEnabled: boolean;
  requireAuth: boolean;
  permissions: string[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: Menu | null;
  children?: Menu[];
}

// 导入Prisma生成的枚举类型
import { MenuType, MenuTarget } from '@/app/generated/prisma';

// 重新导出枚举类型
export { MenuType, MenuTarget };

// 创建菜单请求类型
export interface CreateMenuRequest {
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  parentId?: string;
  type?: MenuType;
  target?: MenuTarget;
  isVisible?: boolean;
  isEnabled?: boolean;
  requireAuth?: boolean;
  permissions?: string[];
  sort?: number;
}

// 更新菜单请求类型
export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
  id: string;
}

// 菜单查询参数
export interface MenuQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: MenuType;
  parentId?: string;
  isVisible?: boolean;
  isEnabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 菜单树节点类型
export interface MenuTreeNode extends Menu {
  key: string;
  children?: MenuTreeNode[];
}

// 菜单统计信息
export interface MenuStats {
  total: number;
  visible: number;
  hidden: number;
  enabled: number;
  disabled: number;
  byType: Record<MenuType, number>;
}
