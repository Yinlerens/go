import prisma from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken, getClientIP } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/types/api";

// 统一响应结构

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "请求参数错误"
        },
        { status: 200 }
      );
    }

    const { password, email, code } = validationResult.data;
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    // 验证验证码
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email,
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!verificationToken) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "验证码无效或已过期"
        },
        { status: 200 }
      );
    }

    // 检查验证码尝试次数
    if (verificationToken.attempts >= verificationToken.maxAttempts) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "验证码尝试次数过多，请重新获取"
        },
        { status: 200 }
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      // 增加验证码尝试次数
      await prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { attempts: verificationToken.attempts + 1 }
      });

      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "邮箱已被注册"
        },
        { status: 200 }
      );
    }

    // 密码哈希
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        lastLoginAt: new Date(),
        lastLoginIp: clientIP,
        loginCount: 1
      }
    });

    // 标记验证码为已使用
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        userId: user.id
      }
    });

    // 生成JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email
    };

    const accessToken = await generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken({ userId: user.id });

    // 保存refresh token到数据库
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

    // 返回成功响应
    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        accessToken,
        refreshToken
      },
      code: 200,
      message: "注册成功"
    });
  } catch (error) {
    console.error("用户注册失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "注册失败，请稍后重试"
      },
      { status: 200 }
    );
  }
}
