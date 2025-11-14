import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Settings validation schema
const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  analysisCompletedNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  securityNotifications: z.boolean().optional(),
});

// GET /api/user/settings - Get user settings
export async function GET(request: NextRequest) {
  // Lazy load Prisma to avoid build-time issues
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  try{
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        emailNotifications: true,
        analysisCompletedNotifications: true,
        marketingEmails: true,
        securityNotifications: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      settings: {
        emailNotifications: user.emailNotifications,
        analysisCompletedNotifications: user.analysisCompletedNotifications,
        marketingEmails: user.marketingEmails,
        securityNotifications: user.securityNotifications,
      },
      profile: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Update user settings
export async function PUT(request: NextRequest) {
  // Lazy load Prisma to avoid build-time issues
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Update user settings
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(validatedData.emailNotifications !== undefined && {
          emailNotifications: validatedData.emailNotifications
        }),
        ...(validatedData.analysisCompletedNotifications !== undefined && {
          analysisCompletedNotifications: validatedData.analysisCompletedNotifications
        }),
        ...(validatedData.marketingEmails !== undefined && {
          marketingEmails: validatedData.marketingEmails
        }),
        ...(validatedData.securityNotifications !== undefined && {
          securityNotifications: validatedData.securityNotifications
        }),
      },
      select: {
        emailNotifications: true,
        analysisCompletedNotifications: true,
        marketingEmails: true,
        securityNotifications: true,
      },
    });

    // Log the settings change
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'login',
        metadata: {
          updatedFields: Object.keys(validatedData),
          newSettings: validatedData,
        },
      },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        emailNotifications: user.emailNotifications,
        analysisCompletedNotifications: user.analysisCompletedNotifications,
        marketingEmails: user.marketingEmails,
        securityNotifications: user.securityNotifications,
      },
    });

  } catch (error) {
    console.error('Update settings error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}