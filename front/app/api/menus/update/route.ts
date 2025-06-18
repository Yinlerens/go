import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable().optional(),
  name: z.string().min(1, "菜单名称不能为空"),
  title: z.string().min(1, "菜单标题不能为空"),
  code: z
    .string()
    .min(1, "菜单编码不能为空")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "编码格式不正确"),
  type: z.enum(["DIRECTORY", "MENU", "BUTTON", "EXTERNAL"]),
  path: z.string().min(1, "路由路径不能为空"),
  component: z.string().optional(),
  redirect: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  permission: z.string().optional(),
  sort: z.number().default(0),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  isCache: z.boolean().default(false),
  isAffix: z.boolean().default(false)
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

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findUnique({
      where: { id }
    });

    if (!existingMenu || existingMenu.isDeleted) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          message: "菜单不存在"
        },
        { status: 200 }
      );
    }

    // 检查编码是否重复（排除自己）
    const duplicateMenu = await prisma.menu.findFirst({
      where: {
        code: data.code,
        id: { not: id },
        isDeleted: false
      }
    });

    if (duplicateMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: "菜单编码已存在"
        },
        { status: 200 }
      );
    }

    // 计算层级
    let level = 1;
    if (data.parentId) {
      const parentMenu = await prisma.menu.findUnique({
        where: { id: data.parentId }
      });
      if (parentMenu) {
        level = parentMenu.level + 1;
      }
    }

    // 更新菜单
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...data,
        level
      }
    });

    // 如果层级发生变化，需要递归更新子菜单的层级
    if (existingMenu.level !== level) {
      await updateChildrenLevel(id, level);
    }

    return NextResponse.json(
      {
        data: menu,
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

// 递归更新子菜单层级
async function updateChildrenLevel(parentId: string, parentLevel: number) {
  const children = await prisma.menu.findMany({
    where: { parentId, isDeleted: false }
  });

  for (const child of children) {
    await prisma.menu.update({
      where: { id: child.id },
      data: { level: parentLevel + 1 }
    });
    await updateChildrenLevel(child.id, parentLevel + 1);
  }
}
