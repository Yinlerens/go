# 菜单管理系统文档

## 概述

这是一个基于 Next.js 15 + Ant Design + Prisma 构建的完整菜单管理系统，支持层级菜单结构、权限控制、动态图标等功能。

## 功能特性

### 🎯 核心功能
- ✅ 完整的 CRUD 操作（创建、读取、更新、删除）
- ✅ 层级菜单结构支持
- ✅ 树形和列表两种视图模式
- ✅ 实时搜索和筛选
- ✅ 拖拽排序（计划中）
- ✅ 权限控制集成
- ✅ 动态图标支持（Lucide React）

### 🎨 用户体验
- ✅ 响应式设计，支持移动端
- ✅ 流畅的动画效果（Framer Motion）
- ✅ 现代化的 UI 设计
- ✅ 智能的加载状态
- ✅ 友好的错误提示（Sonner）

### 🔧 技术特性
- ✅ TypeScript 类型安全
- ✅ React Query 状态管理
- ✅ Prisma ORM 数据库操作
- ✅ 自定义 Hooks 封装
- ✅ API 路由标准化

## 项目结构

```
front/
├── app/
│   ├── api/menus/              # 菜单 API 路由
│   │   ├── route.ts           # 菜单列表和创建
│   │   ├── [id]/route.ts      # 单个菜单操作
│   │   ├── tree/route.ts      # 菜单树结构
│   │   └── stats/route.ts     # 菜单统计
│   └── admin/
│       ├── layout.tsx         # 管理员布局
│       ├── page.tsx          # 管理员首页
│       └── menus/page.tsx    # 菜单管理页面
├── components/Menu/           # 菜单组件
│   ├── MenuLayout.tsx        # 菜单布局组件
│   ├── MenuList.tsx          # 菜单列表组件
│   ├── MenuTree.tsx          # 菜单树组件
│   ├── MenuForm.tsx          # 菜单表单组件
│   ├── MenuStats.tsx         # 菜单统计组件
│   └── index.ts              # 组件导出
├── hooks/
│   └── useMenus.ts           # 菜单相关 Hooks
├── types/
│   └── menu.ts               # 菜单类型定义
└── prisma/
    └── schema.prisma         # 数据库模型
```

## 快速开始

### 1. 安装依赖

```bash
cd front
bun install
```

### 2. 配置数据库

确保 Prisma 配置正确，并运行迁移：

```bash
bunx prisma generate
bunx prisma db push
```

### 3. 启动开发服务器

```bash
bun dev
```

### 4. 访问管理页面

打开浏览器访问：`http://localhost:3000/admin/menus`

## API 接口

### 菜单列表
- **GET** `/api/menus` - 获取菜单列表（支持分页、搜索、筛选）
- **POST** `/api/menus` - 创建新菜单

### 单个菜单
- **GET** `/api/menus/[id]` - 获取菜单详情
- **PUT** `/api/menus/[id]` - 更新菜单
- **DELETE** `/api/menus/[id]` - 删除菜单（软删除）

### 菜单树
- **GET** `/api/menus/tree` - 获取菜单树形结构

### 菜单统计
- **GET** `/api/menus/stats` - 获取菜单统计信息

## 组件使用

### MenuLayout - 菜单布局组件

```tsx
import { MenuLayout } from '@/components/Menu';

function App() {
  return (
    <MenuLayout>
      {/* 你的页面内容 */}
    </MenuLayout>
  );
}
```

### MenuList - 菜单列表组件

```tsx
import { MenuList } from '@/components/Menu';

function MenuManagement() {
  const handleEdit = (menu) => {
    // 处理编辑逻辑
  };

  const handleAdd = () => {
    // 处理新增逻辑
  };

  return (
    <MenuList
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
}
```

### MenuTree - 菜单树组件

```tsx
import { MenuTree } from '@/components/Menu';

function MenuTreeView() {
  return (
    <MenuTree
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
}
```

## Hooks 使用

### useMenus - 菜单列表查询

```tsx
import { useMenus } from '@/hooks/useMenus';

function MenuComponent() {
  const { data, isLoading, error } = useMenus({
    page: 1,
    pageSize: 10,
    search: 'keyword'
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      {data?.data?.items.map(menu => (
        <div key={menu.id}>{menu.title}</div>
      ))}
    </div>
  );
}
```

### useCreateMenu - 创建菜单

```tsx
import { useCreateMenu } from '@/hooks/useMenus';

function CreateMenuForm() {
  const createMenu = useCreateMenu();

  const handleSubmit = (data) => {
    createMenu.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

## 数据模型

### Menu 模型

```typescript
interface Menu {
  id: string;                    // 菜单ID
  name: string;                  // 菜单名称
  path?: string | null;          // 路由路径
  component?: string | null;     // 组件路径
  icon?: string | null;          // 图标名称
  title: string;                 // 菜单标题
  subtitle?: string | null;      // 菜单副标题
  parentId?: string | null;      // 父菜单ID
  level: number;                 // 菜单层级
  sort: number;                  // 排序值
  type: MenuType;                // 菜单类型
  target: MenuTarget;            // 打开方式
  isVisible: boolean;            // 是否显示
  isEnabled: boolean;            // 是否启用
  requireAuth: boolean;          // 是否需要认证
  permissions: string[];         // 权限代码数组
  isDeleted: boolean;            // 是否删除
  deletedAt?: Date | null;       // 删除时间
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  parent?: Menu | null;          // 父菜单
  children?: Menu[];             // 子菜单
}
```

### 菜单类型

```typescript
enum MenuType {
  MENU = 'MENU',           // 菜单
  BUTTON = 'BUTTON',       // 按钮
  IFRAME = 'IFRAME',       // 内嵌页面
  EXTERNAL = 'EXTERNAL'    // 外部链接
}

enum MenuTarget {
  SELF = 'SELF',           // 当前窗口
  BLANK = 'BLANK',         // 新窗口
  PARENT = 'PARENT',       // 父窗口
  TOP = 'TOP'              // 顶级窗口
}
```

## 自定义配置

### 图标配置

系统使用 Lucide React 图标库，支持动态加载图标：

```tsx
import DynamicIcon from '@/components/icon/DynamicIcon';

<DynamicIcon name="user" className="w-4 h-4" />
```

### 权限配置

菜单支持权限控制，可以配置权限代码数组：

```typescript
const menu = {
  // ...其他属性
  requireAuth: true,
  permissions: ['menu:read', 'menu:write']
};
```

## 最佳实践

1. **菜单层级**: 建议不超过 3 层，保持结构清晰
2. **权限设计**: 使用语义化的权限代码，如 `resource:action`
3. **图标选择**: 选择语义明确的图标，保持风格一致
4. **路径规范**: 使用 RESTful 风格的路径命名
5. **性能优化**: 大量菜单时考虑使用虚拟滚动

## 故障排除

### 常见问题

1. **菜单不显示**: 检查 `isVisible` 和 `isEnabled` 状态
2. **权限问题**: 确认用户具有相应的权限代码
3. **图标不显示**: 检查图标名称是否在 Lucide React 中存在
4. **路由跳转失败**: 确认路径配置正确且页面存在

### 调试技巧

1. 使用 React Query DevTools 查看数据状态
2. 检查浏览器控制台的错误信息
3. 使用 Prisma Studio 查看数据库数据
4. 启用详细的日志输出

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License
