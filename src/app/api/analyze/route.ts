// API Route: POST /api/analyze
// Single app analysis with enhanced error handling

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  AppAnalysisError,
  createError,
  formatErrorResponse,
  retryWithBackoff,
  handlePlatformError,
  validateAppUrl,
  sanitizeAppUrl,
  logError
} from '@/lib/error-handler';
import {
  fetchAppStoreReviewsMultiPage,
  fetchAppStoreReviewsMultiCountry,
  fetchAppStoreApp,
  extractAppStoreId
} from '@/lib/scrapers/app-store';
import {
  fetchGooglePlayReviewsMultiPage,
  fetchGooglePlayReviewsMultiCountry,
  fetchGooglePlayApp,
  extractGooglePlayId
} from '@/lib/scrapers/google-play';
import { fetchQuickReviews, fetchIncrementalReviews } from '@/lib/scrapers/quick-fetch';
import { analyzeSingleApp, Review } from '@/lib/ai/openrouter';
import { generateAppSlug, isAnalysisRecent, getCacheDuration } from '@/lib/slug';
import { normalizeCategory } from '@/lib/category';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appUrl, platform, options } = body;

    // Enhanced validation
    if (!appUrl || !platform) {
      return formatErrorResponse(
        createError('INVALID_URL', 'Missing required fields: appUrl, platform')
      );
    }

    if (!['ios', 'android'].includes(platform)) {
      return formatErrorResponse(
        createError('INVALID_PLATFORM', `Invalid platform: ${platform}. Supported platforms: ios, android`)
      );
    }

    // Sanitize URL
    const sanitizedUrl = sanitizeAppUrl(appUrl);

    // URL validation
    let isValidUrl = false;
    const examples: Record<string, string> = {
      ios: 'https://apps.apple.com/us/app/instagram/id389801252',
      android: 'https://play.google.com/store/apps/details?id=com.instagram.android'
    };

    isValidUrl = validateAppUrl(sanitizedUrl, platform);

    if (!isValidUrl) {
      const urlError = createError('INVALID_URL', 'Invalid app URL format');
      urlError.suggestions.push(`Example for ${platform}: ${examples[platform]}`);
      return formatErrorResponse(urlError);
    }

    // Extract app ID from URL
    let appId: string | null = null;
    if (platform === 'ios') {
      appId = extractAppStoreId(appUrl);
    } else if (platform === 'android') {
      appId = extractGooglePlayId(appUrl);
    }

    if (!appId) {
      const urlError = createError('INVALID_URL', 'Could not extract app ID from URL');
      urlError.suggestions.push(
        'Use the complete App Store or Google Play URL',
        'Example iOS: https://apps.apple.com/us/app/instagram/id389801252',
        'Example Android: https://play.google.com/store/apps/details?id=com.instagram.android'
      );
      return formatErrorResponse(urlError);
    }

    // Enhanced app info fetching with retry mechanism
    let appInfo: any;

    try {
      appInfo = await retryWithBackoff(async () => {
        if (platform === 'ios') {
          console.log(`[iOS] Fetching app info for: ${appId}`);
          let info = await fetchAppStoreApp(appId);

          // Try different countries if primary fails
          if (!info) {
            console.log(`[iOS] Trying UK store...`);
            info = await fetchAppStoreApp(appId, 'gb');
          }
          if (!info) {
            console.log(`[iOS] Trying China store...`);
            info = await fetchAppStoreApp(appId, 'cn');
          }

          if (!info) {
            throw createError('APP_NOT_FOUND', `iOS app not found: ${appId}`);
          }

          return info;
        } else {
          console.log(`[Google Play] Fetching app info for: ${appId}`);
          const info = await fetchGooglePlayApp(appId);

          if (!info) {
            throw createError('APP_NOT_FOUND', `Android app not found: ${appId}`);
          }

          return info;
        }
      }, 3, 1000);
    } catch (error) {
      logError(error as Error, {
        platform,
        appId: appId.replace(/(\d{3}).*(\d{3})/, '$1***$2'), // Partially hide for privacy
        sanitizedUrl
      });

      const platformError = handlePlatformError(platform, error as Error);

      // Add platform-specific suggestions
      if (platform === 'ios') {
        platformError.suggestions.push(
          'Try the US version of the App Store URL',
          'Check if the app is available in your region'
        );
      } else {
        platformError.suggestions.push(
          'Try using a VPN if you are in a restricted region',
          'Check if the app is still available on Google Play'
        );
      }

      return formatErrorResponse(platformError);
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
    logError(error as Error, {
      endpoint: 'POST /api/analyze'
    });

    if (error instanceof AppAnalysisError) {
      return formatErrorResponse(error);
    }

    // Handle unexpected errors
    return formatErrorResponse(
      createError('AI_SERVICE_ERROR', 'Analysis service temporarily unavailable')
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
      data: { status: 'processing', progress: 5 },
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
        category: normalizeCategory(appInfo.category) || null, // Save normalized category
        lastCrawledAt: new Date(),
      },
      update: {
        name: appInfo.name,
        rating: appInfo.rating,
        reviewCount: appInfo.reviewCount,
        category: appInfo.category || null, // Update category
        lastCrawledAt: new Date(),
      },
    });

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 15 },
    });

    // Fetch reviews with enhanced sampling and multi-country support
    // 🚀 Enhanced: Always use deep analysis for better insights
    // Base target: 800-1000 reviews for comprehensive analysis
    const reviewTarget = options?.multiCountry ? 1000 : 800;
    const useMultiCountry = options?.multiCountry || false;

    let reviews: any[] = [];

    if (platform === 'ios') {
      if (useMultiCountry) {
        // Multi-country fetching for iOS (500-1000+ reviews)
        const countries = options?.countries || ['us', 'gb', 'ca', 'au', 'de', 'fr', 'jp'];
        console.log(`[iOS] Multi-country fetching: ${reviewTarget} target reviews from ${countries.length} countries`);
        reviews = await fetchAppStoreReviewsMultiCountry(appId, reviewTarget, countries);
      } else {
        // Single country with more pages
        const pages = 10; // Always use max pages for deep analysis
        console.log(`[iOS] Single country fetching: ${pages} pages from US store`);
        reviews = await fetchAppStoreReviewsMultiPage(appId, 'us', pages, reviewTarget);
      }
    } else {
      // Android with enhanced options
      if (useMultiCountry) {
        // Multi-country fetching for Android (800-1000+ reviews)
        const countries = options?.countries || ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'br'];
        console.log(`[Android] Multi-country fetching: ${reviewTarget} target reviews from ${countries.length} countries`);
        reviews = await fetchGooglePlayReviewsMultiCountry(appId, reviewTarget, countries);
      } else {
        // Single country with deep mode
        reviews = await fetchGooglePlayReviewsMultiPage(appId, {
          maxReviews: reviewTarget,
          deepMode: true, // Always use deep mode
        });
      }
    }

    // Update progress after review fetching
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 45 },
    });

    // ⚡ Batch save reviews to database (much faster)
    // Skip duplicates by checking existing reviews first
    const existingReviewIds = await prisma.review.findMany({
      where: {
        platform,
        reviewId: { in: reviews.map(r => r.id) },
      },
      select: { reviewId: true },
    });
    
    const existingIds = new Set(existingReviewIds.map(r => r.reviewId));
    const newReviews = reviews.filter(r => !existingIds.has(r.id));
    
    // Batch insert new reviews only
    if (newReviews.length > 0) {
      await prisma.review.createMany({
        data: newReviews.map(review => ({
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
        })),
        skipDuplicates: true,
      });
    }

    // Update progress after saving reviews
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

    // Enhanced sampling: Ensure comprehensive coverage for all issue types
    // 🚀 Enhanced: Always use deep analysis with balanced review selection
    const maxReviewsForAI = Math.min(300, reviewsToAnalyze.length); // Analyze up to 300 reviews for AI (optimized for prompt limits)

    if (reviewsToAnalyze.length > maxReviewsForAI) {
      // Comprehensive sampling strategy for better issue coverage
      // 50% negative (1-2 stars) for critical issues, 30% mixed (3 stars) for experience issues, 20% positive (4-5 stars) for feature requests
      const criticalIssues = reviewsToAnalyze.filter(r => r.rating <= 2); // Critical issues (1-2 stars)
      const experienceIssues = reviewsToAnalyze.filter(r => r.rating === 3); // Experience issues (3 stars)
      const positiveReviews = reviewsToAnalyze.filter(r => r.rating >= 4); // Positive reviews (4-5 stars)

      const criticalCount = Math.floor(maxReviewsForAI * 0.5); // 50% for critical issues
      const experienceCount = Math.floor(maxReviewsForAI * 0.3); // 30% for experience issues
      const positiveCount = maxReviewsForAI - criticalCount - experienceCount; // 20% for positive

      reviewsToAnalyze = [
        ...criticalIssues.slice(0, criticalCount),
        ...experienceIssues.slice(0, experienceCount),
        ...positiveReviews.slice(0, positiveCount)
      ];

      console.log(`[AI] Enhanced sampling: ${criticalCount} critical, ${experienceCount} experience, ${positiveCount} positive reviews`);
      console.log(`[AI] Total available: ${criticalIssues.length} critical, ${experienceIssues.length} experience, ${positiveReviews.length} positive reviews`);
    }

    // Update progress before AI analysis
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { progress: 70 },
    });

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
      data: { progress: 85 },
    });

    // Get category from database (in case appInfo doesn't have it)
    const appCategory = app.category || normalizeCategory(appInfo.category) || null;
    
    // Save result with reviews data
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        result: {
          app: {
            ...appInfo,
            category: appCategory, // Ensure category is included
            platform, // Include platform for filtering
          },
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
    logError(error, {
      taskId,
      platform,
      appId: appId.replace(/(\d{3}).*(\d{3})/, '$1***$2'),
      phase: 'processing'
    });

    // Enhanced error handling for different failure scenarios
    let errorMessage = 'Analysis failed';
    let errorCode = 'ANALYSIS_ERROR';

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      errorMessage = 'Analysis timeout - please try with fewer reviews';
      errorCode = 'ANALYSIS_TIMEOUT';
    } else if (error.message.includes('memory') || error.message.includes('heap')) {
      errorMessage = 'Too much data - try disabling deep mode';
      errorCode = 'ANALYSIS_TIMEOUT';
    } else if (error.message.includes('AI') || error.message.includes('OpenAI')) {
      errorMessage = 'AI service error - please try again';
      errorCode = 'AI_SERVICE_ERROR';
    }

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMsg: `${errorMessage}: ${error.message}`,
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

