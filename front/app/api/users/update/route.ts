import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string(),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: validationResult.error.issues[0].message,
        },
        { status: 200 }
      );
    }

    const { id, ...data } = validationResult.data;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser || existingUser.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '用户不存在',
        },
        { status: 200 }
      );
    }

    // 更新用户
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        profileCompleted: !!data.nickname || !!existingUser.nickname,
        profileCompletedAt:
          data.nickname && !existingUser.profileCompleted
            ? new Date()
            : existingUser.profileCompletedAt,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        phone: true,
        bio: true,
        status: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        data: user,
        code: 200,
        message: '更新成功',
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
