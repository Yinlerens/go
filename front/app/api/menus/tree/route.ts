import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { Menu, MenuTreeNode } from "@/types/menu";

// GET /api/menus/tree - 获取菜单树形结构
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MenuTreeNode[]>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeHidden = searchParams.get("includeHidden") === "true";
    const includeDisabled = searchParams.get("includeDisabled") === "true";

    // 构建查询条件
    const where = {
      isDeleted: false,
      ...(includeHidden ? {} : { isVisible: true }),
      ...(includeDisabled ? {} : { isEnabled: true })
    };

    // 获取所有菜单
    const menus = await prisma.menu.findMany({
      where,
      orderBy: [
        { level: "asc" },
        { sort: "asc" },
        { createdAt: "asc" }
      ]
    });

    // 构建树形结构
    const menuTree = buildMenuTree(menus);

    return NextResponse.json({
      data: menuTree,
      code: 200,
      success: true,
      message: "菜单树获取成功"
    });
  } catch (error) {
    console.error("获取菜单树失败:", error);
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

// 构建菜单树的辅助函数
function buildMenuTree(menus: Menu[]): MenuTreeNode[] {
  const menuMap = new Map<string, MenuTreeNode>();
  const rootMenus: MenuTreeNode[] = [];

  // 首先创建所有菜单节点
  menus.forEach(menu => {
    const treeNode: MenuTreeNode = {
      ...menu,
      key: menu.id,
      children: []
    };
    menuMap.set(menu.id, treeNode);
  });

  // 然后建立父子关系
  menus.forEach(menu => {
    const treeNode = menuMap.get(menu.id)!;
    
    if (menu.parentId && menuMap.has(menu.parentId)) {
      // 有父菜单，添加到父菜单的children中
      const parentNode = menuMap.get(menu.parentId)!;
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(treeNode);
    } else {
      // 没有父菜单，是根菜单
      rootMenus.push(treeNode);
    }
  });

  // 对每个节点的children进行排序
  const sortChildren = (nodes: MenuTreeNode[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          if (a.sort !== b.sort) {
            return a.sort - b.sort;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        sortChildren(node.children);
      }
    });
  };

  // 对根菜单排序
  rootMenus.sort((a, b) => {
    if (a.sort !== b.sort) {
      return a.sort - b.sort;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // 递归排序所有子菜单
  sortChildren(rootMenus);
 
  return rootMenus;
}
