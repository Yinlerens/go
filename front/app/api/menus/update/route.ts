import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string(),
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

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '菜单不存在',
        },
        { status: 200 }
      );
    }

    // 检查编码是否重复（排除自己）
    const duplicateMenu = await prisma.menu.findFirst({
      where: {
        id: { not: id },
      },
    });

    if (duplicateMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: '菜单编码已存在',
        },
        { status: 200 }
      );
    }

    // 更新菜单
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...data,
      },
    });

    return NextResponse.json(
      {
        data: menu,
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
