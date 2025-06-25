import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
  userId: z.string(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = assignRolesSchema.safeParse(body);

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

    const { roleIds, userId } = validationResult.data;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // 使用事务更新用户角色
    await prisma.$transaction(async tx => {
      // 删除原有的用户-角色关联
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // 创建新的用户-角色关联
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId,
            roleId,
          })),
        });
      }
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: '角色分配成功',
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
