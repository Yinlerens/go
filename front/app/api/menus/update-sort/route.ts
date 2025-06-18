import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const updateSortSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable().optional(),
  sort: z.number()
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = updateSortSchema.safeParse(body);

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

    const { id, parentId, sort } = validationResult.data;

    // 更新排序和父级
    const updateData: any = { sort };
    if (parentId !== undefined) {
      updateData.parentId = parentId;

      // 如果更改了父级，需要更新层级
      let level = 1;
      if (parentId) {
        const parent = await prisma.menu.findUnique({
          where: { id: parentId }
        });
        if (parent) {
          level = parent.level + 1;
        }
      }
      updateData.level = level;
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(
      {
        data: menu,
        code: 200,
        message: "排序更新成功"
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
