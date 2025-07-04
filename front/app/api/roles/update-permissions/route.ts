import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const updatePermissionsSchema = z.object({
  roleId: z.string(),
  menuIds: z.array(z.string()),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = updatePermissionsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: '请求参数错误',
        },
        { status: 200 }
      );
    }

    const { roleId, menuIds } = validationResult.data;

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
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

    // 使用事务更新权限
    await prisma.$transaction(async tx => {
      // 删除原有的角色-菜单关联
      await tx.roleMenu.deleteMany({
        where: { roleId },
      });

      // 创建新的角色-菜单关联
      if (menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map(menuId => ({
            roleId,
            menuId,
          })),
        });
      }
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: '权限更新成功',
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
