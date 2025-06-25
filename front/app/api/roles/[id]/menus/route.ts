import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    // 获取角色的菜单权限
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        roleMenus: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                path: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '角色不存在',
        },
        { status: 200 }
      );
    }

    const menus = role.roleMenus.map(rm => rm.menu);

    return NextResponse.json(
      {
        data: menus,
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
