import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "角色名称不能为空"),
  description: z.string().optional(),
  level: z.number().min(1).max(999),
  dataScope: z.enum(["ALL", "DEPARTMENT", "DEPARTMENT_TREE", "SELF", "CUSTOM"]),
  isActive: z.boolean(),
  isDefault: z.boolean()
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

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

    const { id, ...data } = validationResult.data;

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole || existingRole.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: "角色不存在"
        },
        { status: 200 }
      );
    }

    // 系统角色只能修改部分字段
    if (existingRole.isSystem) {
      delete (data as any).isDefault;
    }

    // 如果设置为默认角色，先取消其他默认角色
    if (data.isDefault && !existingRole.isDefault) {
      await prisma.role.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    // 更新角色
    const role = await prisma.role.update({
      where: { id },
      data
    });

    return NextResponse.json(
      {
        data: role,
        code: 200,
        message: "更新成功"
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
