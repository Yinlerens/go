import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

interface MenuTree {
  id: string;
  title: string;
  value: string;
  children?: MenuTree[];
  disabled?: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 获取所有启用的菜单
    const menus = await prisma.menu.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        type: { in: ["DIRECTORY", "MENU"] } // 只获取目录和菜单类型
      },
      orderBy: [{ level: "asc" }, { sort: "asc" }, { createdAt: "desc" }]
    });

    // 构建树形结构
    const buildTree = (items: any[], parentId: string | null = null): MenuTree[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          title: item.title,
          value: item.id,
          disabled: !item.isActive,
          children: buildTree(items, item.id)
        }))
        .filter(item => item.children?.length || !item.children);
    };

    const tree = buildTree(menus);

    return NextResponse.json(
      {
        data: tree,
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
