// API Route: GET /api/browse
// Browse apps with category and region filters

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeCategory, getCategoryDisplay } from '@/lib/category';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const category = url.searchParams.get('category'); // e.g., "Social Media", "Games"
    const region = url.searchParams.get('region'); // e.g., "us", "gb", "cn"
    const platform = url.searchParams.get('platform'); // 'ios' | 'android' | null
    const sortBy = url.searchParams.get('sort') || 'popular'; // 'popular' | 'recent' | 'rating'

    // Build where clause
    const where: any = {
      status: 'completed',
      isLatest: true,
      appSlug: { not: null },
      result: { not: null },
    };

    if (platform) {
      where.platform = platform;
    }

    // Fetch analyses
    const analyses = await prisma.analysisTask.findMany({
      where,
      take: limit * 3, // Fetch more for filtering
      select: {
        id: true,
        appSlug: true,
        platform: true,
        appStoreId: true,
        completedAt: true,
        result: true,
      },
    });

    // Format and filter
    const seenApps = new Set<string>();
    let formatted = analyses
      .filter(task => {
        // Ensure valid data
        if (!task.result || !(task.result as any).app || !task.appSlug || !task.appStoreId) {
          return false;
        }
        const result = task.result as any;
        const app = result.app;
        
        // Filter by category if specified
        if (category) {
          const normalizedAppCategory = normalizeCategory(app.category);
          const normalizedFilterCategory = normalizeCategory(category);
          if (normalizedAppCategory !== normalizedFilterCategory) {
            return false;
          }
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
          category: normalizeCategory(app.category || 'Uncategorized'),
          appReviewCount: app.reviewCount || 0,
          analyzedAt: task.completedAt,
          reviewCount: result.reviewCount || 0,
          sentiment: result.analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 },
        };
      });

    // Sort
    if (sortBy === 'popular') {
      formatted.sort((a, b) => (b.appReviewCount || 0) - (a.appReviewCount || 0));
    } else if (sortBy === 'recent') {
      formatted.sort((a, b) => (b.analyzedAt?.getTime() || 0) - (a.analyzedAt?.getTime() || 0));
    } else if (sortBy === 'rating') {
      formatted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Limit results
    formatted = formatted.slice(0, limit);

    // Get available categories and regions
    const allAnalyses = await prisma.analysisTask.findMany({
      where: {
        status: 'completed',
        isLatest: true,
        result: { not: null },
      },
      select: {
        result: true,
        platform: true,
      },
      take: 1000, // Sample for statistics
    });

    const categories = new Set<string>();
    const regions = new Set<string>();
    
    allAnalyses.forEach(task => {
      const result = task.result as any;
      if (result?.app?.category) {
        categories.add(normalizeCategory(result.app.category));
      }
      // Note: Region could be extracted from review country if needed
    });

    return NextResponse.json({
      apps: formatted,
      filters: {
        categories: Array.from(categories).sort(),
        regions: ['United States', 'China', 'Japan', 'South Korea', 'United Kingdom'], // Popular regions
      },
      total: formatted.length,
    });
  } catch (error) {
    console.error('Browse API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

