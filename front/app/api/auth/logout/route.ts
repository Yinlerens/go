import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { verifyToken } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 请求验证schema
const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1, { message: "刷新令牌不能为空" })
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    const validationResult = logoutRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: validationResult.error.issues[0]?.message || "请求参数错误"
        },
        { status: 200 }
      );
    }

    const { refreshToken } = validationResult.data;

    // 验证refresh token
    const payload = await verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "刷新令牌无效"
        },
        { status: 200 }
      );
    }

    // 撤销refresh token
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId: payload.userId
      },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    return NextResponse.json({
      data: null,
      code: 200,
      message: "退出登录成功"
    });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "退出登录失败"
      },
      { status: 500 }
    );
  }
}

// 支持GET请求用于简单退出
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 从Authorization header获取token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "未提供有效的授权令牌"
        },
        { status: 200 }
      );
    }

    const accessToken = authHeader.substring(7);
    const payload = await verifyToken(accessToken);

    if (!payload) {
      return NextResponse.json(
        {
          data: null,
          code: 401,
          message: "访问令牌无效"
        },
        { status: 200 }
      );
    }

    // 撤销用户的所有refresh token
    await prisma.refreshToken.updateMany({
      where: {
        userId: payload.userId,
        isRevoked: false
      },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    return NextResponse.json({
      data: null,
      code: 200,
      message: "退出登录成功"
    });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "退出登录失败"
      },
      { status: 200 }
    );
  }
}
