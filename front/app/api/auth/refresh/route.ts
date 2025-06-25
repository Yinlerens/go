import prisma from '@/lib/prisma';
import { generateAccessToken, verifyToken, getClientIP } from '@/utils';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 统一响应结构
interface ApiResponse<T = any> {
  data: T | null;
  code: number;
  msg: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get('refreshToken')?.value!;

    // 验证refresh token
    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          msg: '刷新令牌无效或已过期',
        },
        { status: 401 }
      );
    }
    // 检查数据库中的refresh token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          msg: '刷新令牌无效或已过期',
        },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (!storedToken.user.isActive || storedToken.user.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          msg: '用户账户已被禁用',
        },
        { status: 403 }
      );
    }

    // 生成新的access token
    const tokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
    };

    const newAccessToken = await generateAccessToken(tokenPayload);

    // 返回新的access token
    return NextResponse.json({
      data: {
        accessToken: newAccessToken,
        user: {
          id: storedToken.user.id,
        },
      },
      code: 200,
      msg: '令牌刷新成功',
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        msg: '刷新令牌失败，请重新登录',
      },
      { status: 500 }
    );
  }
}
