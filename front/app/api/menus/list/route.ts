import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

// 请求参数验证
const listSchema = z.object({
  current: z.number().default(1),
  pageSize: z.number().default(20),
  name: z.string().optional(),
  title: z.string().optional(),
  type: z.enum(["DIRECTORY", "MENU", "BUTTON", "EXTERNAL"]).optional(),
  code: z.string().optional(),
  path: z.string().optional(),
  sort: z
    .object({
      createdAt: z.enum(["ascend", "descend"]).optional(),
      sort: z.enum(["ascend", "descend"]).optional()
    })
    .optional()
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const validationResult = listSchema.safeParse(body);

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

    const { current, pageSize, name, title, type, code, path, sort } = validationResult.data;

    // 构建查询条件
    const where: any = {
      isDeleted: false
    };

    if (name) {
      where.name = { contains: name };
    }
    if (title) {
      where.title = { contains: title };
    }
    if (type) {
      where.type = type;
    }
    if (code) {
      where.code = { contains: code };
    }
    if (path) {
      where.path = { contains: path };
    }

    // 构建排序条件
    const orderBy: any = [];
    if (sort?.createdAt) {
      orderBy.push({ createdAt: sort.createdAt === "ascend" ? "asc" : "desc" });
    }
    if (sort?.sort) {
      orderBy.push({ sort: sort.sort === "ascend" ? "asc" : "desc" });
    }
    if (orderBy.length === 0) {
      orderBy.push({ sort: "asc" }, { createdAt: "desc" });
    }

    // 获取根级菜单
    const rootMenus = await prisma.menu.findMany({
      where: {
        ...where,
        parentId: null
      },
      orderBy,
      skip: (current - 1) * pageSize,
      take: pageSize
    });

    // 递归获取子菜单
    const getChildren = async (parentId: string): Promise<any[]> => {
      const children = await prisma.menu.findMany({
        where: {
          parentId,
          isDeleted: false
        },
        orderBy: [{ sort: "asc" }, { createdAt: "desc" }]
      });

      const childrenWithSubChildren = await Promise.all(
        children.map(async child => {
          const subChildren = await getChildren(child.id);
          return {
            ...child,
            children: subChildren.length > 0 ? subChildren : undefined
          };
        })
      );

      return childrenWithSubChildren;
    };

    // 为每个根菜单获取子菜单
    const menusWithChildren = await Promise.all(
      rootMenus.map(async menu => {
        const children = await getChildren(menu.id);
        return {
          ...menu,
          children: children.length > 0 ? children : undefined
        };
      })
    );

    // 获取总数
    const total = await prisma.menu.count({
      where: {
        ...where,
        parentId: null
      }
    });

    return NextResponse.json(
      {
        data: {
          list: menusWithChildren,
          total
        },
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
