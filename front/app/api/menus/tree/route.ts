import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';

interface MenuTree {
  id: string;
  name: string;
  children?: MenuTree[];
  disabled?: boolean;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // 获取所有启用的菜单
    const menus = await prisma.menu.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    // 构建树形结构
    const buildTree = (
      items: any[],
      parentId: string | null = null
    ): MenuTree[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => {
          const children = buildTree(items, item.id);
          const node: MenuTree = {
            id: item.id,
            name: item.name,
            disabled: !item.isActive,
          };
          // 只有当子节点数组不为空时，才添加 children 属性
          if (children.length > 0) {
            node.children = children;
          }
          return node;
        });
    };

    const tree = buildTree(menus);

    return NextResponse.json(
      {
        data: tree,
        code: 200,
        message: '获取成功',
      },
      { status: 200 }
    );
  } catch (error) {
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
