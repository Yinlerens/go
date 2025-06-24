import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "角色名称不能为空"),
  code: z
    .string()
    .min(1, "角色编码不能为空")
    .regex(/^[A-Z][A-Z0-9_]*$/, "编码格式不正确"),
  description: z.string().optional(),
  type: z.enum(["SYSTEM", "CUSTOM"]).default("CUSTOM"),
  level: z.number().min(1).max(999),
  dataScope: z.enum(["ALL", "DEPARTMENT", "DEPARTMENT_TREE", "SELF", "CUSTOM"]).default("SELF"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false)
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = createSchema.safeParse(body);

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

    const data = validationResult.data;

    // 检查编码是否重复
    const existingRole = await prisma.role.findFirst({
      where: {
        code: data.code,
        isDeleted: false
      }
    });

    if (existingRole) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "角色编码已存在"
        },
        { status: 200 }
      );
    }

    // 如果设置为默认角色，先取消其他默认角色
    if (data.isDefault) {
      await prisma.role.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // 创建角色
    const role = await prisma.role.create({
      data: {
        ...data,
        isSystem: false // 新创建的角色都是非系统角色
      }
    });

    return NextResponse.json(
      {
        data: role,
        code: 200,
        message: "创建成功"
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
