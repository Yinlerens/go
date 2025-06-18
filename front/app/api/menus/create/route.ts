import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const createSchema = z.object({
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
    const existingMenu = await prisma.menu.findFirst({
      where: {
        code: data.code,
        isDeleted: false
      }
    });

    if (existingMenu) {
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

    // 创建菜单
    const menu = await prisma.menu.create({
      data: {
        ...data,
        level,
        meta: {}
      }
    });

    return NextResponse.json(
      {
        data: menu,
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
