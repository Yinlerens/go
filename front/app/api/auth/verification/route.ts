import prisma from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { generateVerificationCode, generateToken, getClientIP } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { ses } from "tencentcloud-sdk-nodejs-ses";
import { z } from "zod";

// 统一响应结构

// 请求验证schema
const verificationRequestSchema = z.object({
  email: z.string().email({ message: "邮箱格式错误" })
});

// 腾讯云SES配置
const SesClient = ses.v20201002.Client;
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY
  },
  region: "ap-hongkong",
  profile: {
    httpProfile: {
      endpoint: "ses.tencentcloudapi.com"
    }
  }
};
const client = new SesClient(clientConfig);

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    const validationResult = verificationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          data: null,
          code: 400,
          message: validationResult.error.issues[0]?.message || "请求参数错误"
        },
        { status: 200 }
      );
    }

    const { email } = validationResult.data;
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    // 检查发送频率限制（60秒内不能重复发送）
    const recentVerification = await prisma.verificationToken.findFirst({
      where: {
        email,
        sentAt: {
          gte: new Date(Date.now() - 60 * 1000) // 60秒内
        }
      },
      orderBy: {
        sentAt: "desc"
      }
    });

    if (recentVerification) {
      const remainingTime = Math.ceil(
        (60 * 1000 - (Date.now() - recentVerification.sentAt.getTime())) / 1000
      );
      return NextResponse.json(
        {
          data: null,
          code: 429,
          message: `请等待 ${remainingTime} 秒后重试`
        },
        { status: 200 }
      );
    }

    // 生成验证码和token
    const code = generateVerificationCode();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟后过期

    // 保存验证码到数据库
    await prisma.verificationToken.create({
      data: {
        email,
        code,
        token,
        expiresAt,
        ipAddress: clientIP,
        userAgent
      }
    });

    // 发送邮件
    const emailParams = {
      FromEmailAddress: "hello@syuan.email",
      Destination: [email],
      Subject: "系统验证码",
      Template: {
        TemplateID: 139953,
        TemplateData: JSON.stringify({ code })
      },
      Unsubscribe: "0",
      TriggerType: 1
    };

    await client.SendEmail(emailParams);

    return NextResponse.json({
      data: { token }, // 返回token用于后续验证
      code: 200,
      message: "验证码已发送，请检查您的邮箱"
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    return NextResponse.json(
      {
        data: null,
        code: 500,
        message: "发送验证码失败，请稍后重试"
      },
      { status: 200 }
    );
  }
}
