/**
 * Core authentication utilities without Prisma dependency
 * Safe to use in middleware and build-time contexts
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

