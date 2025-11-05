// API Route: POST /api/analyze
// Single app analysis

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchAppStoreReviewsMultiPage, fetchAppStoreApp, extractAppStoreId } from '@/lib/scrapers/app-store';
import { fetchGooglePlayReviewsMultiPage, fetchGooglePlayApp, extractGooglePlayId } from '@/lib/scrapers/google-play';
import { analyzeSingleApp, Review } from '@/lib/ai/openrouter';
import { generateAppSlug, isAnalysisRecent, getCacheDuration } from '@/lib/slug';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appUrl, platform, options } = body;

    // Validate input
    if (!appUrl || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: appUrl, platform' },
        { status: 400 }
      );
    }

    // Extract app ID from URL
    let appId: string | null = null;
    if (platform === 'ios') {
      appId = extractAppStoreId(appUrl);
    } else if (platform === 'android') {
      appId = extractGooglePlayId(appUrl);
    }

    if (!appId) {
      return NextResponse.json(
        { 
          error: 'Invalid app URL. Please enter a complete App Store or Google Play URL.',
          examples: {
            ios: 'https://apps.apple.com/us/app/instagram/id389801252',
            android: 'https://play.google.com/store/apps/details?id=com.instagram.android'
          }
        },
        { status: 400 }
      );
    }

    // Fetch app info to get name for slug
    let appInfo: any;
    if (platform === 'ios') {
      appInfo = await fetchAppStoreApp(appId);
    } else {
      appInfo = await fetchGooglePlayApp(appId);
    }

    if (!appInfo) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Generate SEO-friendly slug (clean and short)
    const appSlug = generateAppSlug(appInfo.name, platform);

    // Check for recent analysis using intelligent caching
    // Cache duration varies by app popularity (1-30 days)
    const existingAnalysis = await prisma.analysisTask.findFirst({
      where: {
        platform,
        appStoreId: appId,
        isLatest: true,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Intelligent caching: Hot apps (24h), Popular (7d), Normal (14d), Niche (30d)
    if (existingAnalysis && isAnalysisRecent(existingAnalysis.createdAt, appInfo.reviewCount)) {
      const cacheDays = getCacheDuration(appInfo.reviewCount);
      return NextResponse.json({
        taskId: existingAnalysis.id,
        appSlug: existingAnalysis.appSlug || appSlug,
        status: 'completed',
        message: `Using cached analysis (${cacheDays} day${cacheDays > 1 ? 's' : ''} cache)`,
        cached: true,
        cacheDays,
        createdAt: existingAnalysis.createdAt,
      });
    }

    // Mark previous analyses of this app as not latest
    await prisma.analysisTask.updateMany({
      where: { 
        platform,
        appStoreId: appId,
        isLatest: true,
      },
      data: { isLatest: false },
    });

    // Create new analysis task
    const task = await prisma.analysisTask.create({
      data: {
        taskType: 'single',
        status: 'processing',
        platform,
        appStoreId: appId,
        appSlug,
        isLatest: true,
        options: options || {},
      },
    });

    // Start processing in background (in production, use a queue)
    processAnalysis(task.id, platform, appId, appInfo, options).catch(console.error);

    return NextResponse.json({
      taskId: task.id,
      appSlug,
      status: 'pending',
      message: 'Analysis started',
      cached: false,
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAnalysis(
  taskId: string,
  platform: 'ios' | 'android',
  appId: string,
  appInfo: any,
  options: any
) {
  try {
    // Update task status
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { status: 'processing', progress: 10 },
    });

    // Save app to database
    const app = await prisma.app.upsert({
      where: {
        platform_appId: {
          platform,
          appId,
        },
      },
      create: {
        platform,
        appId,
        name: appInfo.name,
        bundleId: appInfo.bundleId,
        iconUrl: appInfo.iconUrl,
        rating: appInfo.rating,
        reviewCount: appInfo.reviewCount,
        developer: appInfo.developer,
        lastCrawledAt: new Date(),
      },
      update: {
        name: appInfo.name,
        rating: appInfo.rating,
        reviewCount: appInfo.reviewCount,
        lastCrawledAt: new Date(),
      },
    });

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 30 },
    });

    // Fetch reviews (increased limits for better analysis)
    let reviews: any[] = [];
    if (platform === 'ios') {
      // iOS: Fetch up to 20 pages (~1000 reviews)
      // Each page has ~50 reviews, RSS feed is free
      reviews = await fetchAppStoreReviewsMultiPage(appId, 'us', 20);
    } else {
      // Android: Fetch up to 2000 reviews
      // Note: May fail in China due to Google Play blocking
      reviews = await fetchGooglePlayReviewsMultiPage(appId, {
        maxReviews: 2000,
      });
    }

    // Save reviews to database
    for (const review of reviews) {
      await prisma.review.upsert({
        where: {
          platform_reviewId: {
            platform,
            reviewId: review.id,
          },
        },
        create: {
          appId: app.id,
          platform,
          reviewId: review.id,
          author: review.author,
          rating: review.rating,
          title: review.title || null,
          content: review.content,
          reviewDate: review.date,
          appVersion: review.appVersion,
          helpfulCount: (review as any).thumbsUp || 0,
        },
        update: {},
      });
    }

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 60 },
    });

    // Filter reviews for analysis (1-3 stars if option set)
    let reviewsToAnalyze = reviews;
    if (options?.ratingFilter) {
      reviewsToAnalyze = reviews.filter(r =>
        options.ratingFilter.includes(r.rating)
      );
    }

    // Perform AI analysis
    const aiReviews: Review[] = reviewsToAnalyze.map(r => ({
      rating: r.rating,
      title: r.title,
      content: r.content,
      author: r.author,
      date: r.date,
      appVersion: r.appVersion,
    }));

    const analysisResult = await analyzeSingleApp(aiReviews);

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 90 },
    });

    // Save result with reviews data
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        result: {
          app: appInfo,
          reviewCount: reviews.length,
          analyzedCount: reviewsToAnalyze.length,
          analysis: analysisResult,
          // Include review data for display
          reviews: reviews.map(r => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            title: r.title,
            content: r.content,
            date: r.date,
            appVersion: r.appVersion,
          })),
        } as any,
        completedAt: new Date(),
      },
    });

  } catch (error: any) {
    console.error('Processing error:', error);
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMsg: error.message,
      },
    });
  }
}

// GET /api/analyze?taskId=xxx or ?slug=xxx - Get analysis status/result
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const taskId = url.searchParams.get('taskId');
  const slug = url.searchParams.get('slug');

  if (!taskId && !slug) {
    return NextResponse.json(
      { error: 'Missing taskId or slug parameter' },
      { status: 400 }
    );
  }

  // Find task by taskId or slug
  let task;
  if (taskId) {
    task = await prisma.analysisTask.findUnique({
      where: { id: taskId },
    });
  } else if (slug) {
    task = await prisma.analysisTask.findFirst({
      where: { 
        appSlug: slug,
        isLatest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!task) {
    return NextResponse.json(
      { error: 'Analysis not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    taskId: task.id,
    appSlug: task.appSlug,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error: task.errorMsg,
  });
}

