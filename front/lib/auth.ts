import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface VerifyAuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

// 从环境变量获取JWT密钥
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return new TextEncoder().encode(secret);
};

// 验证请求中的认证信息
export async function verifyAuth(request: NextRequest): Promise<VerifyAuthResult> {
  try {
    // 从请求头获取 Authorization
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return { success: false, error: "No authorization header" };
    }

    // 检查 Bearer token 格式
    const token = authorization.replace("Bearer ", "");
    if (!token || token === authorization) {
      return { success: false, error: "Invalid token format" };
    }

    // 验证 JWT token
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // 检查 token 是否过期
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { success: false, error: "Token expired" };
    }

    // 返回用户信息
    return {
      success: true,
      userId: payload.userId as string,
      email: payload.email as string
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { success: false, error: "Invalid token" };
  }
}

// 从 cookies 中验证认证信息（可选）
export async function verifyAuthFromCookies(request: NextRequest): Promise<VerifyAuthResult> {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return { success: false, error: "No cookies found" };
    }

    // 解析 cookies
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map(c => {
        const [key, value] = c.split("=");
        return [key, decodeURIComponent(value)];
      })
    );

    const token = cookies.authToken;
    if (!token) {
      return { success: false, error: "No auth token in cookies" };
    }

    // 验证 JWT token
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // 检查 token 是否过期
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { success: false, error: "Token expired" };
    }

    return {
      success: true,
      userId: payload.userId as string,
      email: payload.email as string
    };
  } catch (error) {
    console.error("Cookie auth verification error:", error);
    return { success: false, error: "Invalid token" };
  }
}
