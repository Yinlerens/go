// /app/api/roles/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const listSchema = z.object({
  current: z.number().default(1),
  pageSize: z.number().default(10),
  name: z.string().optional(),
  code: z.string().optional(),
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

    const { current, pageSize, name, code, isActive } = validationResult.data;

    // 构建查询条件
    const where: any = {};

    if (name) {
      where.name = { contains: name };
    }
    if (code) {
      where.code = { contains: code };
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // 查询角色列表
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (current - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              userRoles: true,
              roleMenus: true,
            },
          },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: {
          list: roles,
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
