import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const updatePermissionsSchema = z.object({
  roleId: z.string(),
  menuIds: z.array(z.string()),
  abilityIds: z.array(z.string())
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = updatePermissionsSchema.safeParse(body);

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

    const { roleId, menuIds, abilityIds } = validationResult.data;

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId }
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

    // 使用事务更新权限
    await prisma.$transaction(async tx => {
      // 更新菜单权限
      await tx.role.update({
        where: { id: roleId },
        data: {
          menus: {
            set: menuIds.map(id => ({ id }))
          },
          abilities: {
            set: abilityIds.map(id => ({ id }))
          }
        }
      });
    });

    return NextResponse.json(
      {
        data: null,
        code: 200,
        message: "权限更新成功"
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
