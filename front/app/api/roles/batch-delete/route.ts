import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "请选择要删除的角色")
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = batchDeleteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: validationResult.error.issues[0].message
        },
        { status: 200 }
      );
    }

    const { ids } = validationResult.data;

    // 检查是否包含系统角色或默认角色
    const roles = await prisma.role.findMany({
      where: {
        id: { in: ids },
        isDeleted: false
      },
      include: {
        _count: {
          select: { userRoles: true }
        }
      }
    });

    const systemRoles = roles.filter(r => r.isSystem || r.isDefault);
    if (systemRoles.length > 0) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "包含系统角色或默认角色，不能批量删除"
        },
        { status: 200 }
      );
    }

    // 检查是否有用户在使用
    const usedRoles = roles.filter(r => r._count.userRoles > 0);
    if (usedRoles.length > 0) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: `有 ${usedRoles.length} 个角色正在被使用，请先解除关联`
        },
        { status: 200 }
      );
    }

    // 批量软删除
    await prisma.role.updateMany({
      where: {
        id: { in: ids },
        isSystem: false,
        isDefault: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: "批量删除成功"
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
