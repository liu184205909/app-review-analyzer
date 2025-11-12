// API Route: POST /api/compare
// Create and start competitor comparison analysis

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken, extractTokenFromHeader, canUserAnalyze } from '@/lib/auth';
import { generateAppSlug } from '@/lib/slug';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Validation schema
const comparisonRequestSchema = z.object({
  apps: z.array(z.object({
    appUrl: z.string().url('Invalid app URL'),
    platform: z.enum(['ios', 'android']),
    options: z.object({
      maxReviews: z.number().min(50).max(5000).optional().default(500),
      deepAnalysis: z.boolean().optional().default(true),
      includeHistorical: z.boolean().optional().default(false),
    }).optional(),
  })).min(2, 'At least 2 apps are required for comparison')
    .max(5, 'Maximum 5 apps can be compared at once'),
  comparisonOptions: z.object({
    focusAreas: z.array(z.enum([
      'sentiment', 'features', 'performance', 'ui_ux', 'pricing', 'competitiveness'
    ])).optional().default(['sentiment', 'features']),
    timeRange: z.enum(['last_30_days', 'last_90_days', 'last_6_months', 'all_time']).optional().default('last_90_days'),
    exportFormat: z.enum(['json', 'pdf', 'csv']).optional().default('json'),
  }).optional(),
});

// Helper function to extract app ID from URL
function extractAppId(appUrl: string, platform: 'ios' | 'android'): string {
  if (platform === 'ios') {
    // iOS App Store URL pattern: https://apps.apple.com/us/app/app-name/id123456789
    const match = appUrl.match(/\/id(\d+)/);
    if (match) {
      return match[1];
    }
    throw new Error('Invalid iOS App Store URL');
  } else {
    // Google Play URL pattern: https://play.google.com/store/apps/details?id=com.example.app
    const match = appUrl.match(/id=([^&]+)/);
    if (match) {
      return match[1];
    }
    throw new Error('Invalid Google Play URL');
  }
}

// Generate comparison slug
function generateComparisonSlug(apps: Array<{ name: string; platform: string }>): string {
  const appNames = apps.map(app => {
    const cleanName = app.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return cleanName.substring(0, 20);
  });

  return appNames.slice(0, 3).join('-vs-') + '-comparison';
}

// Process comparison analysis
async function processComparisonAnalysis(
  taskId: string,
  apps: Array<{ appUrl: string; platform: 'ios' | 'android'; options: any }>,
  comparisonOptions: any,
  userId: string
) {
  try {
    console.log(`Starting comparison analysis for task ${taskId}`);

    // Update task status
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    // Analyze each app
    const appAnalyses = [];
    const totalApps = apps.length;

    for (let i = 0; i < totalApps; i++) {
      const { appUrl, platform, options } = apps[i];

      try {
        // Update progress
        await prisma.analysisTask.update({
          where: { id: taskId },
          data: {
            progress: Math.round((i / totalApps) * 100),
            result: {
              currentStep: `Analyzing app ${i + 1} of ${totalApps}`,
              currentAppIndex: i,
              totalApps,
            },
          },
        });

        // Extract app ID
        const appId = extractAppId(appUrl, platform);

        // Import unified review scraper and analysis functions
        const { unifiedReviewScraper } = await import('@/lib/scrapers/unified-reviews');
        const { analyzeSingleApp } = await import('@/lib/ai/openrouter');

        // Extract app info
        let appInfo;
        if (platform === 'ios') {
          const { fetchAppStoreApp } = await import('@/lib/scrapers/app-store');
          appInfo = await fetchAppStoreApp(appId);
        } else {
          const { fetchGooglePlayApp } = await import('@/lib/scrapers/google-play');
          appInfo = await fetchGooglePlayApp(appId);
        }

        // Use unified review scraper with enhanced free data sources
        const scraperResult = await unifiedReviewScraper.getReviews(
          appId,
          platform,
          options?.maxReviews || 2000,
          {
            country: comparisonOptions?.country || 'us',
            language: comparisonOptions?.language || 'en',
            deepMode: comparisonOptions?.deepMode !== false,
          }
        );

        let reviews = scraperResult.reviews;

        // Filter reviews by time range if specified
        if (comparisonOptions?.timeRange && comparisonOptions.timeRange !== 'all_time') {
          const now = new Date();
          let cutoffDate = new Date();

          switch (comparisonOptions.timeRange) {
            case 'last_30_days':
              cutoffDate.setDate(now.getDate() - 30);
              break;
            case 'last_90_days':
              cutoffDate.setDate(now.getDate() - 90);
              break;
            case 'last_6_months':
              cutoffDate.setMonth(now.getMonth() - 6);
              break;
          }

          reviews = reviews.filter(review => {
            const reviewDate = new Date(review.date);
            return reviewDate >= cutoffDate;
          });
        }

        // Analyze reviews with comparison focus
        const analysisResult = await analyzeSingleApp(reviews.map(r => ({
          rating: r.rating,
          title: r.title,
          content: r.content,
          author: r.author,
          date: r.date,
          appVersion: r.appVersion,
        })), {
          ...options,
          focusAreas: comparisonOptions?.focusAreas || ['sentiment', 'features'],
          isComparison: true,
        });

        appAnalyses.push({
          appId,
          platform,
          appInfo,
          reviews,
          analysis: analysisResult,
        });

      } catch (error) {
        console.error(`Error analyzing app ${i + 1}:`, error);
        throw new Error(`Failed to analyze app ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Generate comparison insights
    const comparisonInsights = generateComparisonInsights(appAnalyses, comparisonOptions);

    // Update task with completed results
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        result: {
          comparisonType: 'multi_app',
          totalApps,
          focusAreas: comparisonOptions?.focusAreas,
          timeRange: comparisonOptions?.timeRange,
          apps: appAnalyses.map(analysis => ({
            appId: analysis.appId,
            platform: analysis.platform,
            app: analysis.appInfo,
            reviewCount: analysis.reviews.length,
            analyzedCount: analysis.reviews.length,
            sentiment: analysis.analysis.sentiment,
            criticalIssues: analysis.analysis.criticalIssues || [],
            experienceIssues: analysis.analysis.experienceIssues || [],
            featureRequests: analysis.analysis.featureRequests || [],
            priorityActions: analysis.analysis.priorityActions || [],
            insights: analysis.analysis.insights || [],
          })),
          comparison: comparisonInsights,
          generatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
        reviewCount: appAnalyses.reduce((total, app) => total + app.reviews.length, 0),
      },
    });

    // Log usage
    await Promise.all([
      // Log the usage
      prisma.usageLog.create({
        data: {
          userId,
          actionType: 'analysis_completed',
          taskId,
          metadata: {
            type: 'comparison',
            totalApps,
            appNames: appAnalyses.map(a => a.appInfo?.name || 'Unknown App'),
            focusAreas: comparisonOptions?.focusAreas,
            timeRange: comparisonOptions?.timeRange,
          },
        },
      }),

      // Increment user's monthly analysis count (comparison counts as 1 analysis)
      prisma.user.update({
        where: { id: userId },
        data: {
          monthlyAnalysisCount: {
            increment: 1,
          },
        },
      }),
    ]);

    // 📧 EMAIL NOTIFICATION: Send comparison completion notification (async, don't wait)
    const { notifyAnalysisCompleted } = await import('@/lib/email');
    const comparisonSlug = generateComparisonSlug(
      appAnalyses.map(a => ({ name: a.appInfo?.name || 'Unknown App', platform: a.platform }))
    );
    notifyAnalysisCompleted(userId, `App Comparison (${totalApps} apps)`, comparisonSlug).catch(emailError => {
      console.error('Failed to send comparison completion email:', emailError);
    });

    console.log(`Comparison analysis completed for task ${taskId}`);

  } catch (error: any) {
    console.error('Comparison analysis error:', error);

    // Update task with error
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMsg: error.message,
        completedAt: new Date(),
      },
    });

    // 📧 EMAIL NOTIFICATION: Send comparison failure notification (async, don't wait)
    if (userId) {
      const { notifyAnalysisFailed } = await import('@/lib/email');
      notifyAnalysisFailed(userId, 'App Comparison', error.message).catch(emailError => {
        console.error('Failed to send comparison failure email:', emailError);
      });
    }
  }
}

// Generate comparison insights
function generateComparisonInsights(appAnalyses: any[], comparisonOptions: any) {
  const insights = {
    sentimentComparison: {},
    strengthsComparison: {},
    weaknessesComparison: {},
    featureComparison: {},
    ranking: [],
    recommendations: [],
    marketPosition: {},
  };

  // Compare sentiment scores
  const sentimentScores = appAnalyses.map(app => ({
    name: app.appInfo.name,
    platform: app.platform,
    sentiment: app.analysis.sentiment,
    rating: app.appInfo.rating || 0,
  }));

  sentimentScores.sort((a, b) => {
    const scoreA = a.sentiment.positive - a.sentiment.negative;
    const scoreB = b.sentiment.positive - b.sentiment.negative;
    return scoreB - scoreA;
  });

  insights.sentimentComparison = {
    bestSentiment: sentimentScores[0],
    worstSentiment: sentimentScores[sentimentScores.length - 1],
    ranking: sentimentScores,
  };

  // Compare issues and features
  const allIssues = appAnalyses.flatMap(app =>
    (app.analysis.criticalIssues || []).map((issue: any) => ({
      ...issue,
      appName: app.appInfo?.name || 'Unknown App',
      platform: app.platform,
    }))
  );

  const allFeatures = appAnalyses.flatMap(app =>
    (app.analysis.featureRequests || []).map((feature: any) => ({
      ...feature,
      appName: app.appInfo?.name || 'Unknown App',
      platform: app.platform,
    }))
  );

  // Group issues by title for comparison
  const issuesByTitle = allIssues.reduce((acc, issue) => {
    const key = issue.title.toLowerCase().trim();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(issue);
    return acc;
  }, {});

  insights.strengthsComparison = Object.entries(issuesByTitle)
    .filter(([_, issues]) => (issues as any[]).length === 1) // Issues that only affect one app = potential strength for others
    .map(([title, issues]) => ({
      issue: title,
      affectedApps: (issues as any[]).map((i: any) => i.appName),
      unaffectedApps: appAnalyses.map(a => a.appInfo?.name || 'Unknown App').filter(name => !(issues as any[]).some((i: any) => i.appName === name)),
    }));

  // Generate overall ranking
  const rankingScores = appAnalyses.map(app => {
    const sentimentScore = (app.analysis.sentiment?.positive || 0) - (app.analysis.sentiment?.negative || 0);
    const ratingScore = (app.appInfo.rating || 0) / 5;
    const issuesCount = (app.analysis.criticalIssues?.length || 0);
    const featuresCount = (app.analysis.featureRequests?.length || 0);

    // Simple scoring formula - can be made more sophisticated
    const overallScore = (sentimentScore * 0.4) + (ratingScore * 0.4) - (issuesCount * 0.1) + (featuresCount * 0.1);

    return {
      name: app.appInfo.name,
      platform: app.platform,
      overallScore,
      sentimentScore,
      ratingScore,
      issuesCount,
      featuresCount,
      details: {
        sentiment: app.analysis.sentiment,
        rating: app.appInfo.rating,
        reviewCount: app.reviews.length,
      },
    };
  });

  rankingScores.sort((a, b) => b.overallScore - a.overallScore);
  insights.ranking = rankingScores as any;

  // Generate recommendations
  insights.recommendations = [
    {
      type: 'improvement',
      target: rankingScores[rankingScores.length - 1]?.name,
      recommendation: 'Focus on addressing critical issues mentioned in reviews to improve user satisfaction',
    },
    {
      type: 'strength',
      target: rankingScores[0]?.name,
      recommendation: 'Leverage your high user satisfaction in marketing materials',
    },
    {
      type: 'feature',
      target: 'All apps',
      recommendation: 'Consider implementing the most requested features across all analyzed apps',
    },
  ] as any;

  return insights;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = comparisonRequestSchema.parse(body);

    // 🔒 PAYWALL: Check authentication and subscription
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          message: 'Please sign in to compare apps',
          requiresLogin: true
        },
        { status: 401 }
      );
    }

    // Verify token and get user info
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          error: 'Invalid authentication',
          code: 'INVALID_TOKEN',
          message: 'Please log in again',
          requiresLogin: true
        },
        { status: 401 }
      );
    }

    // Check if user can perform analysis
    const analysisCheck = await canUserAnalyze(payload.userId);

    if (!analysisCheck.canAnalyze) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          message: analysisCheck.reason || 'You have reached your analysis limit',
          requiresUpgrade: true,
          currentTier: payload.subscriptionTier,
          remainingAnalyses: analysisCheck.remainingAnalyses
        },
        { status: 402 } // Payment Required
      );
    }

    // Extract app info for all apps
    const appInfos = [];
    for (const app of validatedData.apps) {
      const appId = extractAppId(app.appUrl, app.platform);
      appInfos.push({
        appId,
        platform: app.platform,
        options: app.options,
      });
    }

    // Create comparison task
    const task = await prisma.analysisTask.create({
      data: {
        userId: payload.userId,
        taskType: 'comparison',
        status: 'pending',
        options: {
          apps: validatedData.apps,
          comparisonOptions: validatedData.comparisonOptions,
        },
      },
    });

    // Create TaskApp entries for each app
    for (let i = 0; i < appInfos.length; i++) {
      const appInfo = appInfos[i];
      await prisma.taskApp.create({
        data: {
          taskId: task.id,
          platform: appInfo.platform,
          appStoreId: appInfo.appId,
          sortOrder: i,
        },
      });
    }

    // Log comparison start
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'analysis_started',
        taskId: task.id,
        metadata: {
          type: 'comparison',
          totalApps: validatedData.apps.length,
          focusAreas: validatedData.comparisonOptions?.focusAreas,
          timeRange: validatedData.comparisonOptions?.timeRange,
        },
      },
    });

    // Start processing in background
    processComparisonAnalysis(
      task.id,
      validatedData.apps,
      validatedData.comparisonOptions,
      payload.userId
    ).catch(console.error);

    return NextResponse.json({
      taskId: task.id,
      message: 'Comparison analysis started successfully',
      totalApps: validatedData.apps.length,
      estimatedTime: `${Math.max(5, validatedData.apps.length * 2)}-${Math.max(10, validatedData.apps.length * 3)} minutes`,
    });

  } catch (error: any) {
    console.error('Comparison analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to start comparison analysis',
        message: error.message,
      },
      { status: 500 }
    );
  }
}