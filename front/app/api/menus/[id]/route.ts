import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { Menu, UpdateMenuRequest } from "@/types/menu";

// GET /api/menus/[id] - 获取单个菜单
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Menu>>> {
  try {
    const { id } = params;

    const menu = await prisma.menu.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        parent: true,
        children: {
          where: { isDeleted: false },
          orderBy: { sort: "asc" }
        }
      }
    });

    if (!menu) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          success: false,
          message: "菜单不存在"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: menu,
      code: 200,
      success: true,
      message: "菜单获取成功"
    });
  } catch (error) {
    console.error("获取菜单失败:", error);
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

// PUT /api/menus/[id] - 更新菜单
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Menu>>> {
  try {
    const { id } = params;
    const body: UpdateMenuRequest = await request.json();

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id,
        isDeleted: false
      }
    });

    if (!existingMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          success: false,
          message: "菜单不存在"
        },
        { status: 404 }
      );
    }

    // 如果更新名称，检查是否与其他菜单重复
    if (body.name && body.name !== existingMenu.name) {
      const duplicateMenu = await prisma.menu.findFirst({
        where: {
          name: body.name,
          id: { not: id },
          isDeleted: false
        }
      });

      if (duplicateMenu) {
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
    }

    // 如果更新父菜单，验证父菜单是否存在且不会造成循环引用
    if (body.parentId !== undefined) {
      if (body.parentId) {
        // 检查父菜单是否存在
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

        // 检查是否会造成循环引用（不能将菜单设置为自己的子菜单的父菜单）
        const isCircularReference = await checkCircularReference(id, body.parentId);
        if (isCircularReference) {
          return NextResponse.json(
            {
              data: null,
              code: 400,
              success: false,
              message: "不能设置循环引用的父菜单"
            },
            { status: 400 }
          );
        }
      }
    }

    // 计算新的层级
    let level = existingMenu.level;
    if (body.parentId !== undefined) {
      if (body.parentId) {
        const parentMenu = await prisma.menu.findUnique({
          where: { id: body.parentId }
        });
        if (parentMenu) {
          level = parentMenu.level + 1;
        }
      } else {
        level = 1;
      }
    }

    // 更新菜单
    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.path !== undefined && { path: body.path }),
        ...(body.component !== undefined && { component: body.component }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.title && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        level,
        ...(body.sort !== undefined && { sort: body.sort }),
        ...(body.type && { type: body.type }),
        ...(body.target && { target: body.target }),
        ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(body.requireAuth !== undefined && { requireAuth: body.requireAuth }),
        ...(body.permissions && { permissions: body.permissions })
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
      data: updatedMenu,
      code: 200,
      success: true,
      message: "菜单更新成功"
    });
  } catch (error) {
    console.error("更新菜单失败:", error);
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

// DELETE /api/menus/[id] - 删除菜单（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = params;

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id,
        isDeleted: false
      },
      include: {
        children: {
          where: { isDeleted: false }
        }
      }
    });

    if (!existingMenu) {
      return NextResponse.json(
        {
          data: null,
          code: 404,
          success: false,
          message: "菜单不存在"
        },
        { status: 404 }
      );
    }

    // 检查是否有子菜单
    if (existingMenu.children && existingMenu.children.length > 0) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          success: false,
          message: "该菜单下还有子菜单，请先删除子菜单"
        },
        { status: 400 }
      );
    }

    // 软删除菜单
    await prisma.menu.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      data: null,
      code: 200,
      success: true,
      message: "菜单删除成功"
    });
  } catch (error) {
    console.error("删除菜单失败:", error);
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

// 检查循环引用的辅助函数
async function checkCircularReference(menuId: string, parentId: string): Promise<boolean> {
  if (menuId === parentId) {
    return true;
  }

  const parent = await prisma.menu.findUnique({
    where: { id: parentId }
  });

  if (!parent || !parent.parentId) {
    return false;
  }

  return checkCircularReference(menuId, parent.parentId);
}
