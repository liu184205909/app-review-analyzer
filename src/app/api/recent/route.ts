// API Route: GET /api/recent
// Get recent analyses (for homepage)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sort') || 'recent'; // 'recent' | 'popular'
    const platform = url.searchParams.get('platform'); // 'ios' | 'android' | null

    // Build where clause
    const where: any = {
      status: 'completed', // 只显示完成的
      isLatest: true,
      appSlug: { not: null }, // 确保有 slug（旧数据可能没有）
    };

    if (platform) {
      where.platform = platform;
    }

    // Fetch completed analyses (more than needed for deduplication)
    const recentAnalyses = await prisma.analysisTask.findMany({
      where,
      orderBy: sortBy === 'popular' 
        ? { createdAt: 'desc' } // TODO: 后续可以按浏览量排序
        : { completedAt: 'desc' },
      take: limit * 3, // Fetch more for deduplication
      select: {
        id: true,
        appSlug: true,
        platform: true,
        appStoreId: true,
        completedAt: true,
        result: true,
      },
    });

    // Format and deduplicate by appStoreId + platform
    const seenApps = new Set<string>();
    const formatted = recentAnalyses
      .filter(task => {
        // Ensure valid data and slug
        if (!task.result || !(task.result as any).app || !task.appSlug || !task.appStoreId) {
          return false;
        }
        // Deduplicate by appStoreId + platform
        const appKey = `${task.appStoreId}-${task.platform}`;
        if (seenApps.has(appKey)) {
          return false;
        }
        seenApps.add(appKey);
        return true;
      })
      .map(task => {
        const result = task.result as any;
        const app = result.app;
        return {
          id: task.id,
          slug: task.appSlug,
          platform: task.platform,
          appName: app.name,
          iconUrl: app.iconUrl,
          rating: app.rating || 0,
          analyzedAt: task.completedAt,
          reviewCount: result.reviewCount || 0,
          sentiment: result.analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 },
        };
      })
      .slice(0, limit); // Take only the requested number after deduplication

    return NextResponse.json({
      analyses: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Recent analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent analyses' },
      { status: 500 }
    );
  }
}

