// API Route: GET /api/popular
// Get popular analyses (well-known apps with high review counts)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const platform = url.searchParams.get('platform'); // 'ios' | 'android' | null

    // Build where clause
    const where: any = {
      status: 'completed',
      isLatest: true,
      appSlug: { not: null },
      result: { not: null }, // Ensure result exists
    };

    if (platform) {
      where.platform = platform;
    }

    // Fetch completed analyses with app info
    // We'll join with App table to get reviewCount for sorting
    const analyses = await prisma.analysisTask.findMany({
      where,
      take: limit * 5, // Fetch more for filtering and deduplication
      select: {
        id: true,
        appSlug: true,
        platform: true,
        appStoreId: true,
        completedAt: true,
        result: true,
      },
    });

    // Format and filter by popularity (high review count)
    const seenApps = new Set<string>();
    const formatted = analyses
      .filter(task => {
        // Ensure valid data
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
          appReviewCount: app.reviewCount || 0, // Total reviews in app store
          analyzedAt: task.completedAt,
          reviewCount: result.reviewCount || 0, // Analyzed reviews
          sentiment: result.analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 },
        };
      })
      // Sort by app review count (popularity) - apps with more reviews are more popular
      .sort((a, b) => (b.appReviewCount || 0) - (a.appReviewCount || 0))
      .slice(0, limit);

    return NextResponse.json({
      analyses: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error('Popular analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular analyses' },
      { status: 500 }
    );
  }
}

