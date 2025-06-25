import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED'])
    .default('ACTIVE'),
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

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: '该邮箱已被注册',
        },
        { status: 200 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        phone: true,
        bio: true,
        status: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        data: user,
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
