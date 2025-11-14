import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth-core';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET;
const APPLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/auth/apple/callback';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const error = formData.get('error') as string;

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('Apple login cancelled')}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=Missing+authorization+code', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: APPLE_CLIENT_ID!,
        client_secret: APPLE_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: APPLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    // Decode ID token to get user info (simplified version)
    const [, payload] = idToken.split('.');
    const userInfo = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Find or create user in database
    const getPrisma = (await import('@/lib/prisma')).default;
    const prisma = getPrisma();

    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.email.split('@')[0],
          passwordHash: null, // No password for OAuth users
          appleId: userInfo.sub,
          emailVerified: userInfo.email_verified === 'true',
        },
      });
    } else if (!user.appleId) {
      // Link Apple account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleId: userInfo.sub,
          emailVerified: userInfo.email_verified === 'true' || user.emailVerified,
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });

    // Redirect to frontend with token
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
    }));

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Apple OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=Apple+login+failed', request.url));
  }
}

