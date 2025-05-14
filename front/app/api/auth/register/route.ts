import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 您的 Prisma Client 实例
import { hash } from "bcryptjs"; // 用于密码哈希
import { registerSchema } from "@/schemas/auth"; // 您的 Zod 注册 schema

// 定义统一的API响应结构 (可选, 但推荐)
interface ApiResponse<T = any> {
  user?: T;
  msg: string;
  errors?: any; // 用于更详细的错误信息，例如Zod的校验错误
  code?: string; // 自定义业务错误码 (可选)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        {
          msg: "请求参数校验失败",
          errors: validation.error.flatten().fieldErrors,
          code: "400"
        },
        { status: 200 } // Bad Request
      );
    }

    const { username, password, email, code } = validation.data;

    // 2. 校验邮箱验证码
    const verificationTokenRecord = await prisma.verificationToken.findUnique({
      where: { identifier: email } // 因为 identifier 是唯一的
    });

    if (!verificationTokenRecord) {
      return NextResponse.json<ApiResponse>(
        { msg: "验证码不存在或邮箱不正确，请先发送验证码", code: "400" },
        { status: 200 }
      );
    }

    if (verificationTokenRecord.token !== code) {
      return NextResponse.json<ApiResponse>({ msg: "验证码不正确", code: "400" }, { status: 200 });
    }

    if (verificationTokenRecord.expires < new Date()) {
      // 可选: 删除已过期的验证码
      await prisma.verificationToken.delete({
        where: { identifier: email }
      });
      return NextResponse.json<ApiResponse>(
        { msg: "验证码已过期，请重新发送。", code: "400" },
        { status: 200 }
      );
    }

    // 3. 检查邮箱是否已被注册
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email }
    });
    if (existingUserByEmail) {
      return NextResponse.json<ApiResponse>(
        { msg: "该邮箱已被注册", code: "409" },
        { status: 200 } // Conflict
      );
    }

    // 4. 检查用户名是否已被注册 (如果您的 User 模型中 username 也是唯一的)
    if (username) {
      // 假设 username 是可选的，如果必填则不需要此判断
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: username }
      });
      if (existingUserByUsername) {
        return NextResponse.json<ApiResponse>(
          { msg: "该用户名已被注册", code: "409" },
          { status: 200 } // Conflict
        );
      }
    }

    // 5. 对密码进行哈希处理
    const hashedPassword = await hash(password, 10); // 第二个参数是 salt rounds

    // 6. 创建新用户
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username, // 如果 User 模型中 username 是可选的，确保这里处理得当
        hashedPassword: hashedPassword,
        isActive: true, // 默认激活用户，或根据您的业务逻辑设置
        emailVerified: new Date() // 既然通过了邮箱验证码，可以将邮箱标记为已验证
        // 根据您的 User 模型，其他必填字段可能需要在此处设置默认值或从请求中获取
      }
    });

    // 7. 注册成功后，删除已使用的验证码
    await prisma.verificationToken.delete({
      where: { identifier: email } // 因为 identifier 是唯一的
    });

    // 从返回的用户信息中移除哈希密码，确保安全
    const { hashedPassword: _, ...userWithoutPassword } = newUser;

    return NextResponse.json<ApiResponse>(
      {
        user: userWithoutPassword,
        msg: "用户注册成功！",
        code: "200"
      },
      { status: 200 } // Created
    );
  } catch (error:any) {
    console.error("注册过程中发生错误:", error);
    // 通用服务器错误
    return NextResponse.json<ApiResponse>(
      { msg: "服务器内部错误，请稍后重试", code: "500", errors: error.message },
      { status: 200 } // Internal Server Error
    );
  }
}
