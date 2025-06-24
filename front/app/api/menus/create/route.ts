import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const createSchema = z.object({
  parentId: z.string().nullable().optional(),
  name: z.string().min(1, '菜单名称不能为空'),
  path: z.string().min(1, '路由路径不能为空'),
  icon: z.string().optional(),
  sort: z.number().default(0),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = createSchema.safeParse(body);

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

    const data = validationResult.data;

    // 创建菜单
    const menu = await prisma.menu.create({
      data,
    });

    return NextResponse.json(
      {
        data: menu,
        code: 200,
        message: '创建成功',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 200 }
    );
  }
}
