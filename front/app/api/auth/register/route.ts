// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 假设您的 Prisma Client 实例路径
import { hash } from "bcryptjs"; // 用于密码哈希，您可能需要安装 bcryptjs: npm install bcryptjs @types/bcryptjs
import { registerSchema } from "@/schemas/auth"; // 引入您的 Zod 验证 schema
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, password, email } = validation.data; // 从验证后的数据中获取 email

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUserByEmail) {
      return NextResponse.json({ message: "该邮箱已被注册" }, { status: 409 });
    }

    // 检查用户名是否已存在 (如果您的 schema 中 username 是唯一的)
      const existingUserByUsername = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUserByUsername) {
      return NextResponse.json({ message: '该用户名已被注册' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email, // 使用从请求中获取的 email
        username: username, // 使用从请求中获取的 username
        hashedPassword: hashedPassword,
        // 根据您的 User 模型，其他必填字段可能需要在此处设置默认值或从请求中获取
        isActive: true,
      }
    });
    
    // 不要在响应中返回密码
    const { hashedPassword: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { user: userWithoutPassword, message: "用户注册成功" },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册错误:", error);
    return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
  }
}
