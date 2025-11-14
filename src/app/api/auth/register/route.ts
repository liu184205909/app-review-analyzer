import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, generateToken } from '@/lib/auth';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 验证schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

export async function POST(request: NextRequest) {
  // Lazy load Prisma to avoid build-time issues
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { email, password, name } = validatedData;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // 创建新用户
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        subscriptionTier: 'free',
        lastResetDate: new Date(),
      },
    });

    // 记录注册使用日志
    await prisma.usageLog.create({
      data: {
        userId: user.id,
        actionType: 'signup',
        metadata: {
          email,
          registrationMethod: 'email',
        },
      },
    });

    // 生成JWT token
    const token = generateToken(user);

    // 返回用户信息（不包含敏感信息）
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    // 📧 EMAIL NOTIFICATION: Send welcome email (async, don't wait)
    const { sendWelcomeEmail } = await import('@/lib/email');
    sendWelcomeEmail(email, name || 'User').catch(emailError => {
      console.error('Failed to send welcome email:', emailError);
    });

    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);

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