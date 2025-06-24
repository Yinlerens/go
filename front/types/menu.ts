// types/menu.ts
export interface MenuNode {
  id: string;
  name: string;
  code: string;
  type: string;
  path: string;
  component?: string;
  redirect?: string;
  title: string;
  icon?: string;
  badge?: string;
  parentId?: string | null;
  level: number;
  sort: number;
  meta?: Record<string, any>;
  permission?: string;
  isVisible: boolean;
  isCache: boolean;
  isAffix: boolean;
  children?: MenuNode[];
}

// ProLayout 需要的菜单格式
export interface ProLayoutMenuItem {
  path: string;
  name: string;
  icon?: any;
  component?: string;
  routes?: ProLayoutMenuItem[];
  hideInMenu?: boolean;
  redirect?: string;
  [key: string]: any;
}
