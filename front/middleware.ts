// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. 指定哪些路径是公共的，不需要认证即可访问
const publicRoutes = ["/", "/login"];

export function middleware(request: NextRequest) {
  // 2. 从 cookies 中获取 refreshToken
  const token = request.cookies.get("refreshToken")?.value;
  const { pathname } = request.nextUrl;

  // 3. 判断当前访问的路径是否为公共路径
  const isPublicRoute = publicRoutes.includes(pathname);

  // --- 核心重定向逻辑 ---

  // 场景A: 用户已登录 (有 token)，但尝试访问登录页
  // -> 重定向到仪表盘或其他受保护的默认页面 (例如 '/dashboard')
  if (token && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 场景B: 用户未登录 (没有 token)，并且访问的不是公共页面
  // -> 重定向到登录页，并附带 callbackUrl 参数
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // 将用户原本想访问的页面路径作为查询参数，方便登录后跳回
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. 如果以上情况都不是，则允许请求继续
  return NextResponse.next();
}

// 5. 配置 Matcher，指定中间件需要作用于哪些路径
// 这样可以避免中间件在图片、静态文件等不必要的请求上运行，提升性能
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，但排除以下开头的路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 这样做可以确保中间件只在页面导航时运行。
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ]
};
