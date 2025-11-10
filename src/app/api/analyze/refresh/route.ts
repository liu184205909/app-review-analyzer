import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/prisma';
import { incrementalScrapeReviews } from '@/lib/incremental-scraper';
import { analyzeSingleApp } from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const { appName, forceReanalysis = false } = await request.json();

    if (!appName) {
      return NextResponse.json({ error: 'App name is required' }, { status: 400 });
    }

    // Find existing app or create new
    let app = await prisma.app.findFirst({
      where: { name: { contains: appName, mode: 'insensitive' } }
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Generate new task ID for fresh analysis
    const taskId = randomUUID();
    const slug = `${appName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // Create new analysis task
    const analysisTask = await prisma.analysisTask.create({
      data: {
        taskType: 'single',
        status: 'processing',
        platform: app.platform || 'ios',
        appStoreId: app.platformAppId || app.name,
        appSlug: slug,
        isLatest: true,
        options: { forceRefresh: true }
      }
    });

    // Start background analysis process
    (async () => {
      try {
        console.log(`Starting forced reanalysis for ${appName} with 2000+ reviews target`);

        // Force re-scraping with higher target
        await incrementalScrapeReviews({
          appId: app.platformAppId || app.id,
          platform: app.platform || 'ios',
          targetCount: 5000,
          maxNewReviews: 2000,
          forceRefresh: true
        });

        // Get all reviews for analysis
        const reviews = await prisma.review.findMany({
          where: { appId: app.id },
          orderBy: { reviewDate: 'desc' },
          take: 2000 // Use 2000 reviews for AI analysis
        });

        console.log(`Collected ${reviews.length} reviews for AI analysis`);

        // Update progress
        await prisma.analysisTask.update({
          where: { id: taskId },
          data: {
            status: 'processing',
            progress: 40,
            reviewCount: reviews.length
          }
        });

        if (reviews.length === 0) {
          throw new Error('No reviews found for analysis');
        }

        // Perform AI analysis with updated configuration
        console.log('Starting AI analysis with enhanced configuration (40-60 issues per category)');
        const analysis = await analyzeSingleApp(reviews, app.name);

        // Save analysis results
        await prisma.analysisTask.update({
          where: { id: taskId },
          data: {
            status: 'completed',
            progress: 100,
            result: JSON.stringify({
              app: {
                name: app.name,
                iconUrl: app.iconUrl,
                rating: app.rating,
                reviewCount: app.reviewCount
              },
              reviewCount: reviews.length,
              analyzedCount: reviews.length,
              analysis,
              reviews: reviews.map(r => ({
                id: r.id,
                author: r.author,
                rating: r.rating,
                title: r.title,
                content: r.content,
                date: r.reviewDate,
                appVersion: r.version
              }))
            })
          }
        });

        console.log(`Force reanalysis completed for ${appName}`);
        console.log(`Generated ${analysis.criticalIssues?.length || 0} critical issues`);
        console.log(`Generated ${analysis.experienceIssues?.length || 0} experience issues`);
        console.log(`Generated ${analysis.featureRequests?.length || 0} feature requests`);
        console.log(`Included ${reviews.length} reviews in analysis`);

      } catch (error) {
        console.error('Force reanalysis failed:', error);

        await prisma.analysisTask.update({
          where: { id: taskId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    })();

    return NextResponse.json({
      taskId,
      slug,
      message: 'Force reanalysis started successfully. Collecting 2000+ reviews and generating 40-60 issues per category.'
    });

  } catch (error) {
    console.error('Failed to start force reanalysis:', error);
    return NextResponse.json(
      { error: 'Failed to start force reanalysis' },
      { status: 500 }
    );
  }
}