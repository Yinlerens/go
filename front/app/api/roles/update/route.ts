import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '角色名称不能为空').max(100),
  code: z.string().min(1, '角色代码不能为空').max(50),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean(),
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

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: '角色不存在',
        },
        { status: 200 }
      );
    }

    // 检查名称和代码是否与其他角色冲突
    const conflictRole = await prisma.role.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ name: data.name }, { code: data.code }],
          },
        ],
      },
    });

    if (conflictRole) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message:
            conflictRole.name === data.name
              ? '角色名称已存在'
              : '角色代码已存在',
        },
        { status: 200 }
      );
    }

    // 更新角色
    const role = await prisma.role.update({
      where: { id },
      data,
    });

    return NextResponse.json(
      {
        data: role,
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
