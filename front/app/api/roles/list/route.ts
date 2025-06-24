import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { z } from "zod";

const listSchema = z.object({
  current: z.number().default(1),
  pageSize: z.number().default(10),
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(["SYSTEM", "CUSTOM"]).optional(),
  dataScope: z.enum(["ALL", "DEPARTMENT", "DEPARTMENT_TREE", "SELF", "CUSTOM"]).optional(),
  isActive: z.boolean().optional(),
  sort: z
    .object({
      level: z.enum(["ascend", "descend"]).optional(),
      createdAt: z.enum(["ascend", "descend"]).optional()
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

    const { current, pageSize, name, code, type, dataScope, isActive, sort } =
      validationResult.data;

    // 构建查询条件
    const where: any = {
      isDeleted: false
    };

    if (name) {
      where.name = { contains: name };
    }
    if (code) {
      where.code = { contains: code };
    }
    if (type) {
      where.type = type;
    }
    if (dataScope) {
      where.dataScope = dataScope;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // 构建排序条件
    const orderBy: any = [];
    if (sort?.level) {
      orderBy.push({ level: sort.level === "ascend" ? "asc" : "desc" });
    }
    if (sort?.createdAt) {
      orderBy.push({ createdAt: sort.createdAt === "ascend" ? "asc" : "desc" });
    }
    if (orderBy.length === 0) {
      orderBy.push({ level: "asc" }, { createdAt: "desc" });
    }

    // 查询角色列表
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy,
        skip: (current - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              userRoles: true,
              menus: true,
              abilities: true
            }
          }
        }
      }),
      prisma.role.count({ where })
    ]);

    return NextResponse.json(
      {
        data: {
          list: roles,
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