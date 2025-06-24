import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string()
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = deleteSchema.safeParse(body);

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

    const { id } = validationResult.data;

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userRoles: true }
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

    // 系统角色和默认角色不能删除
    if (role.isSystem || role.isDefault) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "系统角色或默认角色不能删除"
        },
        { status: 200 }
      );
    }

    // 检查是否有用户在使用此角色
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: `有 ${role._count.userRoles} 个用户正在使用此角色，请先解除关联`
        },
        { status: 200 }
      );
    }

    // 软删除角色
    await prisma.role.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: "删除成功"
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
