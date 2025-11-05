// API Route: GET /api/recent
// Get recent analyses (for homepage)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '6');

    // Fetch recent completed analyses
    const recentAnalyses = await prisma.analysisTask.findMany({
      where: {
        status: {
          in: ['completed', 'partial'], // 包括部分完成的
        },
        isLatest: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        appSlug: true,
        platform: true,
        status: true,
        progress: true,
        createdAt: true,
        completedAt: true,
        result: true,
      },
    });

    // Format response
    const formatted = recentAnalyses.map(task => ({
      id: task.id,
      slug: task.appSlug,
      platform: task.platform,
      appName: task.result ? (task.result as any).app?.name : 'Unknown App',
      iconUrl: task.result ? (task.result as any).app?.iconUrl : null,
      status: task.status,
      progress: task.progress,
      analyzedAt: task.completedAt || task.createdAt,
      reviewCount: task.result ? (task.result as any).reviewCount : 0,
    }));

    return NextResponse.json({
      analyses: formatted,
    });
  } catch (error) {
    console.error('Recent analyses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent analyses' },
      { status: 500 }
    );
  }
}

