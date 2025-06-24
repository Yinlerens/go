import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(100),
  code: z.string().min(1, '角色代码不能为空').max(50),
  description: z.string().max(500).optional(),
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

    // 检查角色名称是否已存在
    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existingRole) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message:
            existingRole.name === data.name
              ? '角色名称已存在'
              : '角色代码已存在',
        },
        { status: 200 }
      );
    }

    // 创建角色
    const role = await prisma.role.create({
      data,
    });

    return NextResponse.json(
      {
        data: role,
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
        message: '服务器错误',
      },
      { status: 200 }
    );
  }
}
