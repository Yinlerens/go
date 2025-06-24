import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { getUserFromHeaders } from '@/utils';

interface MenuNode {
  id: string;
  name: string;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sort: number;
  isVisible: boolean;
  children?: MenuNode[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MenuNode[]>>> {
  try {
    const { userId } = getUserFromHeaders(request.headers);

    // 获取用户及其角色的菜单
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '用户不存在',
        },
        { status: 200 }
      );
    }

    // 检查用户状态
    if (!user.isActive || user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          message: '用户已被禁用',
        },
        { status: 200 }
      );
    }

    // 收集所有角色的菜单（去重）
    const menuMap = new Map<string, any>();

    for (const userRole of user.userRoles) {
      if (userRole.role.isActive) {
        for (const roleMenu of userRole.role.roleMenus) {
          const menu = roleMenu.menu;
          if (menu.isActive && menu.isVisible && !menuMap.has(menu.id)) {
            menuMap.set(menu.id, menu);
          }
        }
      }
    }

    // 转换为数组并排序
    const allMenus = Array.from(menuMap.values()).sort(
      (a, b) => a.sort - b.sort
    );

    // 构建树形结构
    const buildMenuTree = (
      menus: any[],
      parentId: string | null = null
    ): MenuNode[] => {
      return menus
        .filter(menu => menu.parentId === parentId)
        .map(menu => {
          const children = buildMenuTree(menus, menu.id);
          const node: MenuNode = {
            id: menu.id,
            name: menu.name,
            path: menu.path,
            component: menu.component,
            icon: menu.icon,
            parentId: menu.parentId,
            sort: menu.sort,
            isVisible: menu.isVisible,
          };

          if (children.length > 0) {
            node.children = children;
          }

          return node;
        });
    };

    const menuTree = buildMenuTree(allMenus);

    return NextResponse.json(
      {
        data: menuTree,
        code: 200,
        message: '获取成功',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取用户菜单失败:', error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: '服务器错误',
      },
      { status: 200 }
    );
  }
}
