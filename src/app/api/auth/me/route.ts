import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken, getUserWithSubscription } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 从请求头中提取token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // 验证token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 获取用户完整信息
    const userWithSubscription = await getUserWithSubscription(payload.userId);
    if (!userWithSubscription) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查用户是否可以进行分析
    const analysisCheck = await canUserAnalyze(payload.userId);

    // 获取订阅限制信息
    const subscriptionLimits = await getSubscriptionLimits(userWithSubscription.subscriptionTier);

    // 返回用户信息
    const userResponse = {
      id: userWithSubscription.id,
      email: userWithSubscription.email,
      name: userWithSubscription.name,
      avatar: userWithSubscription.avatar,
      subscriptionTier: userWithSubscription.subscriptionTier,
      emailVerified: userWithSubscription.emailVerified,
      preferredLanguage: userWithSubscription.preferredLanguage,
      timezone: userWithSubscription.timezone,
      monthlyAnalysisCount: userWithSubscription.monthlyAnalysisCount,
      lastResetDate: userWithSubscription.lastResetDate,
      activeSubscription: userWithSubscription.activeSubscription,
      createdAt: userWithSubscription.createdAt,
    };

    return NextResponse.json({
      user: userResponse,
      canAnalyze: analysisCheck,
      subscriptionLimits,
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 从auth.ts导入这个函数（临时解决方案，后续可以移到专门的utilities文件）
async function canUserAnalyze(userId: string) {
  const { canUserAnalyze } = await import('@/lib/auth');
  return canUserAnalyze(userId);
}

async function getSubscriptionLimits(tier: string) {
  const { getSubscriptionLimits } = await import('@/lib/auth');
  return getSubscriptionLimits(tier);
}