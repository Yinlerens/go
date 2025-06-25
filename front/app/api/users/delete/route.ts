import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const deleteSchema = z.object({
  id: z.string(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = deleteSchema.safeParse(body);

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

    const { id } = validationResult.data;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '用户不存在',
        },
        { status: 200 }
      );
    }

    // 软删除用户
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: '删除成功',
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
