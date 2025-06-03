import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

// 模拟数据库
const users = [
  {
    id: "1",
    email: "user1@example.com",
    name: "User 1",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    email: "user2@example.com",
    name: "User 2",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // 模拟分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = users.slice(start, end);

    return NextResponse.json({
      data: paginatedUsers,
      code: 200,
      success: true,
      message: "Users fetched successfully"
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        code: 500,
        success: false,
        message: "Internal server error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const newUser = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    return NextResponse.json({
      data: newUser,
      code: 201,
      success: true,
      message: "User created successfully"
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        code: 400,
        success: false,
        message: "Bad request"
      },
      { status: 400 }
    );
  }
}
