import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, generateToken, getUserWithSubscription } from '@/lib/auth';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 验证schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  // Lazy load Prisma to avoid build-time issues
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const { email, password } = validatedData;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 验证密码（仅对有密码的用户）
    if (user.passwordHash) {
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } else {
      // 如果用户没有密码（例如通过OAuth注册），则不允许邮箱登录
      return NextResponse.json(
        { error: 'Please use social login to sign in' },
        { status: 401 }
      );
    }

    // 获取完整的用户信息（包括订阅状态）
    const userWithSubscription = await getUserWithSubscription(user.id);

    // 记录登录使用日志
    await prisma.usageLog.create({
      data: {
        userId: user.id,
        actionType: 'login',
        metadata: {
          loginMethod: 'email',
        },
      },
    });

    // 生成JWT token
    const token = generateToken(user);

    // 返回用户信息
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      monthlyAnalysisCount: userWithSubscription?.monthlyAnalysisCount || 0,
      activeSubscription: userWithSubscription?.activeSubscription || null,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}