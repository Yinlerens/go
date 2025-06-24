import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 获取所有功能权限
    const abilities = await prisma.ability.findMany({
      where: {
        isActive: true
      },
      orderBy: [{ module: "asc" }, { code: "asc" }]
    });

    return NextResponse.json(
      {
        data: abilities,
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
