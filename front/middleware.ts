import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './utils';

// 需要保护的 API 路径
const PROTECTED_PATHS = [
  '/api/menus',
  '/api/user',
  '/api/roles',
  '/api/upload',
  '/api/users',
];

// 检查路径是否需要保护
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只对受保护的 API 路径进行检查
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 从请求头中获取 token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  // 如果没有 token，返回 401
  if (!token) {
    return NextResponse.json(
      {
        error: 'Access denied',
        message: '无token',
        code: 1001,
      },
      { status: 401 }
    );
  }

  // 验证 token
  const { valid, payload, error } = await verifyToken(token);

  if (!valid) {
    return NextResponse.json(
      {
        code: 1002,
        error: 'Access denied',
        message: 'token已过期',
      },
      { status: 401 }
    );
  }

  // Token 有效，将用户信息添加到请求头中，供 API 路由使用
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId as string);
  requestHeaders.set('x-user-email', payload.email as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    '/api/menus/:path*',
    '/api/user/:path*',
    '/api/roles/:path*',
    '/api/upload/:path*',
    '/api/users/:path*',
  ],
};
