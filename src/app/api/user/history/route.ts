// API Route: GET /api/user/history
// Get current user's analysis history

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'completed' | 'processing' | 'failed' | null
    const platform = url.searchParams.get('platform'); // 'ios' | 'android' | null
    const sortBy = url.searchParams.get('sort') || 'recent'; // 'recent' | 'app_name' | 'status'
    const search = url.searchParams.get('search'); // Search by app name

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: payload.userId,
    };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (search) {
      where.OR = [
        {
          result: {
            path: ['app', 'name'],
            string_contains: search,
            mode: 'insensitive',
          },
        },
        {
          appSlug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }; // Default: most recent first
    switch (sortBy) {
      case 'app_name':
        orderBy = {
          result: {
            path: ['app', 'name'],
            mode: 'insensitive',
          },
        };
        break;
      case 'status':
        orderBy = [{ status: 'asc' }, { createdAt: 'desc' }];
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch user's analyses with pagination
    const [analyses, total] = await Promise.all([
      prisma.analysisTask.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          appSlug: true,
          platform: true,
          appStoreId: true,
          status: true,
          taskType: true,
          createdAt: true,
          completedAt: true,
          result: true,
          // Only select necessary fields from result for performance
          // The full result can be fetched when needed
        },
      }),
      prisma.analysisTask.count({ where }),
    ]);

    // Format the analyses for frontend
    const formattedAnalyses = analyses.map(task => {
      const result = task.result as any;
      const app = result?.app;

      return {
        id: task.id,
        slug: task.appSlug,
        platform: task.platform,
        appStoreId: task.appStoreId,
        status: task.status,
        taskType: task.taskType,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        // App info (if available)
        app: app ? {
          name: app.name,
          iconUrl: app.iconUrl,
          rating: app.rating,
          reviewCount: app.reviewCount,
        } : null,
        // Analysis summary (if completed)
        summary: result && task.status === 'completed' ? {
          totalReviews: result.reviewCount || 0,
          analyzedCount: result.analyzedCount || 0,
          sentiment: result.analysis?.sentiment || { positive: 0, negative: 0, neutral: 0 },
          criticalIssuesCount: result.analysis?.criticalIssues?.length || 0,
          priorityActionsCount: result.analysis?.priorityActions?.length || 0,
        } : null,
        // Processing info (if processing)
        processing: task.status === 'processing' ? {
          currentStep: result?.currentStep || 'initializing',
          progress: result?.progress || 0,
          estimatedTimeRemaining: result?.estimatedTimeRemaining,
        } : null,
      };
    });

    // Return paginated response
    return NextResponse.json({
      analyses: formattedAnalyses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      filters: {
        status,
        platform,
        sortBy,
        search,
      },
    });

  } catch (error) {
    console.error('User history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis history' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/history - Delete specific analysis
export async function DELETE(request: NextRequest) {
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

    const { analysisId } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Verify the analysis belongs to the user
    const analysis = await prisma.analysisTask.findFirst({
      where: {
        id: analysisId,
        userId: payload.userId,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the analysis
    await prisma.analysisTask.delete({
      where: { id: analysisId },
    });

    // Log the deletion
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'analysis_completed',
        metadata: {
          analysisId,
          appName: (analysis.result as any)?.app?.name || 'Unknown',
          platform: analysis.platform,
        },
      },
    });

    return NextResponse.json({
      message: 'Analysis deleted successfully',
    });

  } catch (error) {
    console.error('Delete analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}