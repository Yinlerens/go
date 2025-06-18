import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { verifyAuth } from "@/lib/auth";

interface MenuNode {
  id: string;
  name: string;
  code: string;
  type: string;
  path: string | null;
  component: string | null;
  redirect: string | null;
  title: string;
  icon: string | null;
  badge: string | null;
  parentId: string | null;
  level: number;
  sort: number;
  meta: any;
  permission: string | null;
  isVisible: boolean;
  isCache: boolean;
  isAffix: boolean;
  children?: MenuNode[];
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "未授权访问"
        },
        { status: 200 }
      );
    }

    const userId = authResult.userId;

    // 获取用户信息及角色
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          },
          include: {
            role: {
              include: {
                menus: {
                  where: {
                    isDeleted: false,
                    isActive: true,
                    isVisible: true,
                    type: { in: ["DIRECTORY", "MENU", "EXTERNAL"] } // 不返回按钮类型
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: "用户不存在"
        },
        { status: 200 }
      );
    }

    // 检查用户状态
    if (!user.isActive || user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          message: "用户已被禁用"
        },
        { status: 200 }
      );
    }

    // 收集所有角色的菜单（去重）
    const menuMap = new Map<string, any>();

    for (const userRole of user.userRoles) {
      if (userRole.role.isActive) {
        for (const menu of userRole.role.menus) {
          if (!menuMap.has(menu.id)) {
            menuMap.set(menu.id, menu);
          }
        }
      }
    }

    // 转换为数组并按层级和排序号排序
    const allMenus = Array.from(menuMap.values()).sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.sort - b.sort;
    });

    // 构建树形结构
    const buildMenuTree = (menus: any[], parentId: string | null = null): MenuNode[] => {
      return menus
        .filter(menu => menu.parentId === parentId)
        .map(menu => {
          const children = buildMenuTree(menus, menu.id);
          const node: MenuNode = {
            id: menu.id,
            name: menu.name,
            code: menu.code,
            type: menu.type,
            path: menu.path,
            component: menu.component,
            redirect: menu.redirect,
            title: menu.title,
            icon: menu.icon,
            badge: menu.badge,
            parentId: menu.parentId,
            level: menu.level,
            sort: menu.sort,
            meta: menu.meta || {},
            permission: menu.permission,
            isVisible: menu.isVisible,
            isCache: menu.isCache,
            isAffix: menu.isAffix
          };

          if (children.length > 0) {
            node.children = children;
          }

          return node;
        });
    };

    const menuTree = buildMenuTree(allMenus);

    // 如果用户没有任何菜单权限，返回默认菜单
    if (menuTree.length === 0) {
      const defaultMenus = await getDefaultMenus();
      return NextResponse.json(
        {
          data: defaultMenus,
          code: 200,
          message: "获取成功"
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        data: menuTree,
        code: 200,
        message: "获取成功"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("获取用户菜单失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "服务器错误"
      },
      { status: 200 }
    );
  }
}

// 获取默认菜单（新用户或无权限用户）
async function getDefaultMenus(): Promise<MenuNode[]> {
  // 查找默认角色
  const defaultRole = await prisma.role.findFirst({
    where: {
      isDefault: true,
      isActive: true,
      isDeleted: false
    },
    include: {
      menus: {
        where: {
          isDeleted: false,
          isActive: true,
          isVisible: true,
          type: { in: ["DIRECTORY", "MENU", "EXTERNAL"] }
        }
      }
    }
  });

  if (!defaultRole || defaultRole.menus.length === 0) {
    // 如果没有默认角色或默认角色没有菜单，返回最基础的菜单
    return [
      {
        id: "dashboard",
        name: "仪表盘",
        code: "dashboard",
        type: "MENU",
        path: "/dashboard",
        component: "@/views/dashboard/index",
        redirect: null,
        title: "仪表盘",
        icon: "dashboard",
        badge: null,
        parentId: null,
        level: 1,
        sort: 0,
        meta: {},
        permission: null,
        isVisible: true,
        isCache: false,
        isAffix: true
      },
      {
        id: "profile",
        name: "个人中心",
        code: "profile",
        type: "MENU",
        path: "/profile",
        component: "@/views/profile/index",
        redirect: null,
        title: "个人中心",
        icon: "user",
        badge: null,
        parentId: null,
        level: 1,
        sort: 100,
        meta: {},
        permission: null,
        isVisible: true,
        isCache: false,
        isAffix: false
      }
    ];
  }

  // 构建默认角色的菜单树
  const menus = defaultRole.menus.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.sort - b.sort;
  });

  const buildTree = (items: any[], parentId: string | null = null): MenuNode[] => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => {
        const children = buildTree(items, item.id);
        const node: MenuNode = {
          id: item.id,
          name: item.name,
          code: item.code,
          type: item.type,
          path: item.path,
          component: item.component,
          redirect: item.redirect,
          title: item.title,
          icon: item.icon,
          badge: item.badge,
          parentId: item.parentId,
          level: item.level,
          sort: item.sort,
          meta: item.meta || {},
          permission: item.permission,
          isVisible: item.isVisible,
          isCache: item.isCache,
          isAffix: item.isAffix
        };

        if (children.length > 0) {
          node.children = children;
        }

        return node;
      });
  };

  return buildTree(menus);
}
