import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth-core';

// 定义不需要认证的路径
const publicPaths = [
  '/',
  '/features',
  '/browse',
  '/login',
  '/register',
  '/pricing',
  '/subscription/success',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/health',
  '/api/recent',
  '/api/popular',
  '/api/browse',
  '/api/analyze',
  '/api/schedule-update',
  '/api/stripe/webhook',
  '/api/data-sources',
  // Static assets
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源和 Next.js 内部路径不需要认证
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 检查是否是公共路径
  const isPublicPath = publicPaths.some(path => {
    // 精确匹配
    if (path === pathname) return true;
    // 前缀匹配（用于 /_next 等）
    if (pathname.startsWith(path + '/')) return true;
    return false;
  });

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 只对 API 路由进行认证检查（页面路由在客户端检查）
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 验证token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 将用户信息添加到请求头中，供后续API使用
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-tier', payload.subscriptionTier);

    return response;
  }

  // 所有非 API 的页面路由都允许访问（在客户端进行认证检查）
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};