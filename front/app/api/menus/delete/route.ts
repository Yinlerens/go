import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string()
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
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

    // 检查是否有子菜单
    const childrenCount = await prisma.menu.count({
      where: {
        parentId: id
      }
    });

    if (childrenCount > 0) {
      await deleteMenuAndChildren(id);
    } else {
      await prisma.menu.delete({
        where: { id }
      });
    }

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

// 递归删除菜单及其子菜单
async function deleteMenuAndChildren(menuId: string) {
  // 获取所有子菜单
  const children = await prisma.menu.findMany({
    where: {
      parentId: menuId
    }
  });

  // 递归删除子菜单
  for (const child of children) {
    await deleteMenuAndChildren(child.id);
  }

  // 删除当前菜单
  await prisma.menu.delete({
    where: { id: menuId }
  });
}
