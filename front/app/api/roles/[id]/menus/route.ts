import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const roleId = params.id;

    // 获取角色的菜单权限
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        menus: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            title: true
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
        data: role.menus,
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
