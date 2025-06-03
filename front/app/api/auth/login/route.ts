import prisma from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken, getClientIP } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: validationResult.error.issues[0].message || "请求参数错误"
        },
        { status: 200 }
      );
    }

    const { email, password } = validationResult.data;
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "邮箱或密码错误"
        },
        { status: 200 }
      );
    }

    // 检查用户状态
    if (!user.isActive) {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          message: "账户已被禁用，请联系管理员"
        },
        { status: 200 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          message: "账户已被暂停，请联系管理员"
        },
        { status: 200 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        {
          data: null,
          code: 403,
          message: "账户已被封禁，请联系管理员"
        },
        { status: 200 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "用户名或密码错误"
        },
        { status: 200 }
      );
    }

    // 更新用户登录信息
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: clientIP,
        loginCount: user.loginCount + 1
      }
    });

    // 生成JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email
    };

    const accessToken = await generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken({ userId: user.id });

    // 清理过期的refresh tokens
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }]
      }
    });

    // 保存新的refresh token到数据库
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        ipAddress: clientIP,
        userAgent
      }
    });
    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken);
    // 返回成功响应
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          status: user.status,
          profileCompleted: user.profileCompleted,
          phone: user.phone,
          bio: user.bio
        },
        accessToken
      },
      code: 200,
      message: "登录成功"
    });
  } catch (error) {
    console.error("用户登录失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "登录失败，请稍后重试"
      },
      { status: 200 }
    );
  }
}
