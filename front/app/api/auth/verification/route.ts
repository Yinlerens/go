import prisma from "@/lib/prisma";
import { generateVerificationCode } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { ses } from "tencentcloud-sdk-nodejs-ses"; // 请确保这个导入路径是正确的
import { z } from "zod";
// 统一响应结构
interface ApiResponse<T = any> {
  data: T | null;
  code: string;
  msg: string;
}

// 自定义内部状态码
const CustomResponseCodes = {
  SUCCESS: "200", // 操作成功
  ERROR: "500" // 请求参数校验失败
};

// Zod Schema (与你提供的原始代码一致)
const SendEmailRequestSchema = z.object({
  email: z
    .string({
      required_error: "邮箱地址不能为空"
    })
    .email({
      message: "请输入有效的邮箱地址"
    })
});

// SES Client 初始化 (与你提供的原始代码一致)
const SesClient = ses.v20201002.Client;
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY
  },
  region: "ap-hongkong", // 请确保区域正确
  profile: {
    httpProfile: {
      endpoint: "ses.tencentcloudapi.com"
    }
  }
};
const client = new SesClient(clientConfig);

export async function POST(req: NextRequest) {
  let responsePayload: ApiResponse;

  try {
    const body = await req.json(); // 尝试解析请求体
    // 1. 参数校验
    const validationResult = SendEmailRequestSchema.safeParse(body);
    if (!validationResult.success) {
      responsePayload = {
        data: null,
        code: CustomResponseCodes.ERROR,
        msg: "请求参数校验失败"
      };
      return NextResponse.json(responsePayload, { status: 200 });
    }

    // 校验成功，获取数据
    const { email } = validationResult.data;
    const existingToken = await prisma.verificationToken.findUnique({
      where: { identifier: email }
    });
    if (existingToken) {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 一分钟前的时间
      // existingToken.createdAt 是上次创建/发送的时间
      if (existingToken.createdAt > oneMinuteAgo) {
        const secondsRemaining = Math.ceil(
          (existingToken.createdAt.getTime() + 60000 - now.getTime()) / 1000
        );
        responsePayload = {
          data: null,
          code: CustomResponseCodes.ERROR, // 或者使用一个特定的频率限制错误码
          msg: `请求过于频繁，请在 ${secondsRemaining} 秒后重试。`
        };
        return NextResponse.json(responsePayload, { status: 200 }); // 或 429 Too Many Requests
      }
    }
    // 2. 准备发送邮件的参数
    const expires = new Date(new Date().getTime() + 5 * 60 * 1000);
    const code = generateVerificationCode();
    const params = {
      FromEmailAddress: "hello@syuan.email", // 确保此发信地址已在腾讯云SES验证
      Destination: [email],
      Subject: "系统验证码",
      Template: {
        TemplateID: 139953, // 确保此模板ID存在且配置正确
        TemplateData: JSON.stringify({ code }) // 推荐使用JSON.stringify确保格式，并使code为字符串类型
      },
      Unsubscribe: "0", // 根据需要配置退订选项
      TriggerType: 1 // 1 表示触发类邮件 (验证码、交易通知等)
    };

    try {
      await prisma.verificationToken.upsert({
        where: { identifier: email },
        update: {
          token: code,
          expires: expires,
          createdAt: new Date() // 显式更新 createdAt 时间为当前发送时间
        },
        create: {
          identifier: email,
          token: code,
          expires: expires
          // createdAt 会由 @default(now()) 自动设置，但 upsert 的 update 部分需要显式设置
        }
      });
      await client.SendEmail(params);
      responsePayload = {
        data: null,
        code: CustomResponseCodes.SUCCESS,
        msg: "验证码发送成功"
      };
    } catch (sesError: any) {
      if (sesError.code && sesError.message) {
        responsePayload = {
          data: null,
          code: CustomResponseCodes.ERROR,
          msg: sesError.message
        };
      } else {
        responsePayload = {
          data: null,
          code: CustomResponseCodes.ERROR,
          msg: "未知错误，请稍后重试"
        };
      }
    }
  } catch (error: any) {
    responsePayload = {
      data: null,
      code: CustomResponseCodes.ERROR,
      msg: error.message
    };
  }

  return NextResponse.json(responsePayload, { status: 200 });
}
