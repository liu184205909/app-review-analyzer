// Health Check API
import { NextResponse } from 'next/server';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Lazy load Prisma to avoid build-time issues
    const prisma = (await import('@/lib/prisma')).default;
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      env: {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}

