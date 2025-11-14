import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/auth/apple/callback';

export async function GET(request: NextRequest) {
  try {
    // Check if Apple OAuth is configured
    if (!APPLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Apple OAuth is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    // Build Apple OAuth URL
    const appleAuthUrl = new URL('https://appleid.apple.com/auth/authorize');
    appleAuthUrl.searchParams.append('client_id', APPLE_CLIENT_ID);
    appleAuthUrl.searchParams.append('redirect_uri', APPLE_REDIRECT_URI);
    appleAuthUrl.searchParams.append('response_type', 'code');
    appleAuthUrl.searchParams.append('scope', 'name email');
    appleAuthUrl.searchParams.append('response_mode', 'form_post');

    // Redirect to Apple OAuth
    return NextResponse.redirect(appleAuthUrl.toString());
  } catch (error) {
    console.error('Apple OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Apple login' },
      { status: 500 }
    );
  }
}

