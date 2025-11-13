import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth-core';

// 定义不需要认证的路径
const publicPaths = [
  '/',
  '/api/auth/register',
  '/api/auth/login',
  '/api/health',
  '/api/recent',
  '/api/popular',
  '/api/browse',
  '/api/analyze', // 允许匿名用户查看分析结果，但在创建时需要认证
  '/api/schedule-update',
  '/api/stripe/webhook', // Stripe webhook endpoint
  '/login',
  '/register',
  '/pricing',
  '/subscription/success', // Payment success page
  // Note: /dashboard/*, /compare/*, and /api/user/* require authentication and are handled by middleware
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公共路径
  const isPublicPath = publicPaths.some(path => {
    if (path === pathname) return true;
    if (path.endsWith('/') && pathname.startsWith(path.slice(0, -1))) return true;
    if (path.includes(':') && pathname.startsWith(path.split(':')[0])) return true;
    return false;
  });

  // 静态资源文件和API健康检查不需要认证
  const isStaticResource = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname);
  const isHealthCheck = pathname === '/api/health';

  if (isPublicPath || isStaticResource || isHealthCheck) {
    return NextResponse.next();
  }

  // 对于需要认证的路径，验证token
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // 如果是API路由，返回401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 如果是页面路由，重定向到登录页面
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 验证token
  const payload = verifyToken(token);
  if (!payload) {
    // token无效
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 将用户信息添加到请求头中，供后续API使用
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-tier', payload.subscriptionTier);

  return response;
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