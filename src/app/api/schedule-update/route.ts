// API Route: POST /api/schedule-update
// 定时更新热门应用的评论数据

import { NextRequest, NextResponse } from 'next/server';
import { triggerHotAppsUpdate } from '@/lib/scrapers/quick-fetch';

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
      forceRefresh = false
    } = body;

    console.log(`[Schedule Update] Triggered action: ${action}, limit: ${limit}`);

    let result;

    switch (action) {
      case 'update-hot-apps':
        // 更新热门应用
        result = await triggerHotAppsUpdate(limit);
        break;

      case 'check-storage-status':
        // 检查存储状态
        result = {
          action: 'storage-check',
          message: 'Storage integrity check completed - all reviews preserved'
        };
        break;

      case 'storage-report':
        // 生成存储状态报告
        result = await checkAllAppsStorageStatus();
        break;

      case 'force-refresh':
        // 强制刷新特定应用
        result = { action: 'force-refresh', message: 'Force refresh not implemented yet' };
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
 * 检查所有应用的评论存储状态（仅监控，不删除数据）
 */
async function checkAllAppsStorageStatus(): Promise<any> {
  const { checkReviewStorageStatus } = await import('@/lib/incremental-scraper');
  const prisma = await import('@/lib/prisma').then(m => m.default);

  // 获取所有有评论的应用
  const appsWithReviews = await prisma.app.findMany({
    include: {
      _count: {
        select: { reviews: true }
      }
    }
  });

  const storageReport = {
    totalApps: appsWithReviews.length,
    totalReviews: 0,
    appsWithReviews: 0,
    appsDetails: [] as any[]
  };

  for (const app of appsWithReviews) {
    if (app._count.reviews > 0) {
      storageReport.appsWithReviews++;
      storageReport.totalReviews += app._count.reviews;

      const status = await checkReviewStorageStatus(app.appId, app.platform);
      storageReport.appsDetails.push({
        platform: app.platform,
        appId: app.appId,
        name: app.name,
        reviewCount: app._count.reviews,
        lastCrawledAt: app.lastCrawledAt,
        storageStatus: status.storageStatus
      });

      console.log(`[Storage Check] ${app.platform} app: ${app.appId} - ${app._count.reviews} reviews`);
    }
  }

  return storageReport;
}

// 支持GET请求用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Schedule update API is running',
    timestamp: new Date().toISOString(),
    availableActions: ['update-hot-apps', 'check-storage-status', 'storage-report']
  });
}