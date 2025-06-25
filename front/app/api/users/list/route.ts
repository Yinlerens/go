import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const listSchema = z.object({
  current: z.number().default(1),
  pageSize: z.number().default(10),
  nickname: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = listSchema.safeParse(body);

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

    const { current, pageSize, nickname, email, phone, status, isActive } =
      validationResult.data;

    // 构建查询条件
    const where: any = {
      isDeleted: false,
    };

    if (nickname) {
      where.nickname = { contains: nickname };
    }
    if (email) {
      where.email = { contains: email };
    }
    if (phone) {
      where.phone = { contains: phone };
    }
    if (status) {
      where.status = status;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // 查询用户列表
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (current - 1) * pageSize,
        take: pageSize,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: {
          list: users,
          total,
        },
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
