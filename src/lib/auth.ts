import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET as string || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  subscriptionTier: string;
}

/**
 * 生成JWT token
 */
export function generateToken(user: {
  id: string;
  email: string;
  subscriptionTier: string;
}): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 从请求头中提取token
 */
export function extractTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 获取用户信息（包含订阅状态）
 */
export async function getUserWithSubscription(userId: string) {
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

/**
 * 获取用户订阅限制信息
 */
export function getSubscriptionLimits(tier: string) {
  switch (tier) {
    case 'free':
      return {
        monthlyAnalyses: 3,
        maxReviewsPerAnalysis: 500,
        features: ['Basic analysis', 'Standard report'],
      };
    case 'professional':
      return {
        monthlyAnalyses: -1, // Unlimited
        maxReviewsPerAnalysis: 2000,
        features: [
          'Unlimited analyses',
          'Advanced analysis',
          'Detailed reports',
          'Historical data',
          'Priority support',
        ],
      };
    case 'team':
      return {
        monthlyAnalyses: -1, // Unlimited
        maxReviewsPerAnalysis: 5000,
        features: [
          'All Professional features',
          'Multi-user collaboration',
          'Advanced analytics',
          'API access',
          'Custom reports',
          'Dedicated support',
        ],
      };
    default:
      return getSubscriptionLimits('free');
  }
}