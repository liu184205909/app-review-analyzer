// API Route: POST /api/schedule-update
// 定时更新热门应用的评论数据

import { NextRequest, NextResponse } from 'next/server';
import { triggerHotAppsUpdate } from '@/lib/scrapers/quick-fetch';
import { cleanupOldReviews } from '@/lib/incremental-scraper';

// 简单的密钥验证（生产环境应使用更安全的方式）
const SCHEDULE_SECRET = process.env.SCHEDULE_SECRET || 'schedule-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    // 验证请求密钥
    const authHeader = request.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== SCHEDULE_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      action = 'update-hot-apps',
      limit = 10,
      cleanup = false,
      cleanupKeepCount = 1000
    } = body;

    console.log(`[Schedule Update] Triggered action: ${action}, limit: ${limit}`);

    let result;

    switch (action) {
      case 'update-hot-apps':
        // 更新热门应用
        result = await triggerHotAppsUpdate(limit);
        break;

      case 'cleanup-old-reviews':
        // 清理旧评论数据
        if (cleanup) {
          const cleanedApps = await cleanupOldReviewsForAllApps(cleanupKeepCount);
          result = {
            action: 'cleanup',
            appsProcessed: cleanedApps.length,
            keepCount: cleanupKeepCount
          };
        } else {
          result = { action: 'cleanup', message: 'Cleanup not requested' };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('[Schedule Update] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 清理所有应用的旧评论数据
 */
async function cleanupOldReviewsForAllApps(keepCount: number = 1000): Promise<string[]> {
  const { cleanupOldReviews } = await import('@/lib/incremental-scraper');
  const prisma = await import('@/lib/prisma').then(m => m.default);

  // 获取所有有评论的应用
  const appsWithReviews = await prisma.app.findMany({
    include: {
      _count: {
        select: { reviews: true }
      }
    }
  });

  const processedApps: string[] = [];

  for (const app of appsWithReviews) {
    if (app._count.reviews > keepCount) {
      await cleanupOldReviews(app.appId, app.platform, keepCount);
      processedApps.push(`${app.platform}:${app.appId}`);
      console.log(`[Cleanup] Processed ${app.platform} app: ${app.appId}`);
    }
  }

  return processedApps;
}

// 支持GET请求用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Schedule update API is running',
    timestamp: new Date().toISOString(),
    availableActions: ['update-hot-apps', 'cleanup-old-reviews']
  });
}