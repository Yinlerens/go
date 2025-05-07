import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 获取认证令牌
  const authToken = request.cookies.get("refresh_auth_token")?.value;
  // 如果用户未登录，重定向到登录页面
  if (!authToken) {
    const { pathname } = request.nextUrl;
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 用户已登录，继续处理请求
  return NextResponse.next();
}

// 使用多个正则表达式来精确控制中间件应用的路径
export const config = {
  matcher: [
    // 排除特定路径
    "/((?!$|auth|_next|api|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
