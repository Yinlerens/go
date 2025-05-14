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
  SUCCESS: "0", // 操作成功
  ERROR: "500" // 请求参数校验失败
};

// Zod Schema (与你提供的原始代码一致)
const SendEmailRequestSchema = z.object({
  toAddress: z
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
    const { toAddress } = validationResult.data;
    // 2. 准备发送邮件的参数
    const params = {
      FromEmailAddress: "hello@syuan.email", // 确保此发信地址已在腾讯云SES验证
      Destination: [toAddress],
      Subject: "系统验证码",
      Template: {
        TemplateID: 139953, // 确保此模板ID存在且配置正确
        TemplateData: JSON.stringify({ code: generateVerificationCode() }) // 推荐使用JSON.stringify确保格式，并使code为字符串类型
      },
      Unsubscribe: "0", // 根据需要配置退订选项
      TriggerType: 1 // 1 表示触发类邮件 (验证码、交易通知等)
    };

    try {
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
