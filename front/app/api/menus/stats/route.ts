import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { MenuStats, MenuType } from "@/types/menu";

// GET /api/menus/stats - 获取菜单统计信息
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MenuStats>>> {
  try {
    // 获取总数
    const total = await prisma.menu.count({
      where: { isDeleted: false }
    });

    // 获取可见菜单数量
    const visible = await prisma.menu.count({
      where: {
        isDeleted: false,
        isVisible: true
      }
    });

    // 获取隐藏菜单数量
    const hidden = await prisma.menu.count({
      where: {
        isDeleted: false,
        isVisible: false
      }
    });

    // 获取启用菜单数量
    const enabled = await prisma.menu.count({
      where: {
        isDeleted: false,
        isEnabled: true
      }
    });

    // 获取禁用菜单数量
    const disabled = await prisma.menu.count({
      where: {
        isDeleted: false,
        isEnabled: false
      }
    });

    // 按类型统计
    const menuTypeStats = await prisma.menu.groupBy({
      by: ['type'],
      where: { isDeleted: false },
      _count: {
        type: true
      }
    });

    // 构建按类型统计的对象
    const byType: Record<MenuType, number> = {
      [MenuType.MENU]: 0,
      [MenuType.BUTTON]: 0,
      [MenuType.IFRAME]: 0,
      [MenuType.EXTERNAL]: 0
    };

    menuTypeStats.forEach(stat => {
      byType[stat.type as MenuType] = stat._count.type;
    });

    const stats: MenuStats = {
      total,
      visible,
      hidden,
      enabled,
      disabled,
      byType
    };

    return NextResponse.json({
      data: stats,
      code: 200,
      success: true,
      message: "菜单统计信息获取成功"
    });
  } catch (error) {
    console.error("获取菜单统计信息失败:", error);
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
