import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const roleId = params.id;

    // 获取角色的功能权限
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        abilities: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            code: true,
            module: true
          }
        }
      }
    });

    if (!role || role.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: "角色不存在"
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        data: role.abilities,
        code: 200,
        message: "获取成功"
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "服务器错误"
      },
      { status: 200 }
    );
  }
}
