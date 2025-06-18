import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

const checkSchema = z.object({
  path: z.string().optional(),
  code: z.string().optional(),
  permission: z.string().optional()
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 验证用户身份
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        {
          data: false,
          code: 401,
          message: "未授权访问"
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const validationResult = checkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: false,
          code: 400,
          message: "请求参数错误"
        },
        { status: 200 }
      );
    }

    const { path, code, permission } = validationResult.data;

    // 构建查询条件
    const where: any = {
      isDeleted: false,
      isActive: true
    };

    if (path) {
      where.path = path;
    }
    if (code) {
      where.code = code;
    }
    if (permission) {
      where.permission = permission;
    }

    // 获取用户的所有菜单权限
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        userRoles: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          },
          include: {
            role: {
              include: {
                menus: {
                  where
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          data: false,
          code: 404,
          message: "用户不存在"
        },
        { status: 200 }
      );
    }

    // 检查是否有匹配的菜单权限
    let hasPermission = false;
    for (const userRole of user.userRoles) {
      if (userRole.role.isActive && userRole.role.menus.length > 0) {
        hasPermission = true;
        break;
      }
    }

    return NextResponse.json(
      {
        data: hasPermission,
        code: 200,
        message: "检查成功"
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: false,
        code: 500,
        message: "服务器错误"
      },
      { status: 200 }
    );
  }
}
