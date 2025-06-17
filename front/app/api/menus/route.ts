import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { Menu, CreateMenuRequest } from "@/types/menu";
import { Prisma } from "@/app/generated/prisma";

// GET /api/menus - 获取菜单列表
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Menu>>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") as any;
    const parentId = searchParams.get("parentId");
    const isVisible = searchParams.get("isVisible");
    const isEnabled = searchParams.get("isEnabled");
    const sortBy = searchParams.get("sortBy") || "sort";
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" || "asc";

    // 构建查询条件
    const where: Prisma.MenuWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { path: { contains: search, mode: "insensitive" } }
        ]
      }),
      ...(type && { type }),
      ...(parentId !== null && { parentId: parentId || null }),
      ...(isVisible !== null && { isVisible: isVisible === "true" }),
      ...(isEnabled !== null && { isEnabled: isEnabled === "true" })
    };

    // 计算总数
    const total = await prisma.menu.count({ where });

    // 获取菜单列表
    const menus = await prisma.menu.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: { isDeleted: false },
          orderBy: { sort: "asc" }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: {
        items: menus,
        total,
        page,
        pageSize,
        totalPages
      },
      code: 200,
      success: true,
      message: "菜单列表获取成功"
    });
  } catch (error) {
    console.error("获取菜单列表失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        success: false,
        message: "服务器内部错误"
      },
      { status: 500 }
    );
  }
}

// POST /api/menus - 创建菜单
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Menu>>> {
  try {
    const body: CreateMenuRequest = await request.json();

    // 验证必填字段
    if (!body.name || !body.title) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          success: false,
          message: "菜单名称和标题为必填项"
        },
        { status: 400 }
      );
    }

    // 检查菜单名称是否已存在
    const existingMenu = await prisma.menu.findFirst({
      where: {
        name: body.name,
        isDeleted: false
      }
    });

    if (existingMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          success: false,
          message: "菜单名称已存在"
        },
        { status: 400 }
      );
    }

    // 如果有父菜单，验证父菜单是否存在
    if (body.parentId) {
      const parentMenu = await prisma.menu.findFirst({
        where: {
          id: body.parentId,
          isDeleted: false
        }
      });

      if (!parentMenu) {
        return NextResponse.json(
          {
            data: null,
            code: 400,
            success: false,
            message: "父菜单不存在"
          },
          { status: 400 }
        );
      }
    }

    // 计算菜单层级
    let level = 1;
    if (body.parentId) {
      const parentMenu = await prisma.menu.findUnique({
        where: { id: body.parentId }
      });
      if (parentMenu) {
        level = parentMenu.level + 1;
      }
    }

    // 创建菜单
    const menu = await prisma.menu.create({
      data: {
        name: body.name,
        path: body.path,
        component: body.component,
        icon: body.icon,
        title: body.title,
        subtitle: body.subtitle,
        parentId: body.parentId,
        level,
        sort: body.sort || 0,
        type: body.type || "MENU",
        target: body.target || "SELF",
        isVisible: body.isVisible ?? true,
        isEnabled: body.isEnabled ?? true,
        requireAuth: body.requireAuth ?? true,
        permissions: body.permissions || []
      },
      include: {
        parent: true,
        children: {
          where: { isDeleted: false },
          orderBy: { sort: "asc" }
        }
      }
    });

    return NextResponse.json({
      data: menu,
      code: 201,
      success: true,
      message: "菜单创建成功"
    });
  } catch (error) {
    console.error("创建菜单失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        success: false,
        message: "服务器内部错误"
      },
      { status: 500 }
    );
  }
}
