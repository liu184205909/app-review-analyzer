/**
 * Authentication utilities with database access
 * For functions that don't need database, see auth-core.ts
 */

// Re-export core functions
export {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  hashPassword,
  verifyPassword,
  getSubscriptionLimits,
  type JWTPayload,
} from './auth-core';

/**
 * 获取用户信息（包含订阅状态）
 * Uses lazy import of Prisma to avoid build-time issues
 */
export async function getUserWithSubscription(userId: string) {
  const prisma = (await import('./prisma')).default;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: {
          status: 'active',
          currentPeriodEnd: {
            gt: new Date(),
          },
        },
        orderBy: {
          currentPeriodEnd: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!user) return null;

  // 检查订阅是否过期
  const activeSubscription = user.subscriptions[0];
  const isSubscriptionActive = activeSubscription &&
    activeSubscription.currentPeriodEnd > new Date();

  // 重置月度分析计数（如果需要）
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  const shouldResetMonthlyCount =
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (shouldResetMonthlyCount) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyAnalysisCount: 0,
        lastResetDate: now,
      },
    });
    user.monthlyAnalysisCount = 0;
  }

  return {
    ...user,
    activeSubscription: isSubscriptionActive ? activeSubscription : null,
  };
}

/**
 * 检查用户是否可以进行分析
 */
export async function canUserAnalyze(userId: string): Promise<{
  canAnalyze: boolean;
  reason?: string;
  remainingAnalyses?: number;
  subscriptionTier: string;
}> {
  const user = await getUserWithSubscription(userId);
  if (!user) {
    return { canAnalyze: false, reason: 'User not found', subscriptionTier: 'free' };
  }

  const { subscriptionTier, activeSubscription } = user;

  // 专业和团队用户有无限分析次数
  if (subscriptionTier === 'professional' || subscriptionTier === 'team') {
    return { canAnalyze: true, subscriptionTier };
  }

  // 免费用户每月3次分析
  if (subscriptionTier === 'free') {
    const monthlyLimit = 3;
    const remaining = Math.max(0, monthlyLimit - user.monthlyAnalysisCount);

    return {
      canAnalyze: remaining > 0,
      reason: remaining > 0 ? undefined : 'Monthly analysis limit reached',
      remainingAnalyses: remaining,
      subscriptionTier,
    };
  }

  return { canAnalyze: true, subscriptionTier };
}

/**
 * 记录分析使用
 */
export async function recordAnalysisUsage(userId: string, taskId: string) {
  const prisma = (await import('./prisma')).default;
  
  // 增加月度分析计数
  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyAnalysisCount: {
        increment: 1,
      },
    },
  });

  // 记录使用日志
  await prisma.usageLog.create({
    data: {
      userId,
      taskId,
      actionType: 'analysis_started',
    },
  });
}
