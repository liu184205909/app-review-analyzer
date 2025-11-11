// API Route: GET /api/data-sources
// Get information about available free review data sources

import { NextRequest, NextResponse } from 'next/server';
import { unifiedReviewScraper } from '@/lib/scrapers/unified-reviews';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('appId');
    const platform = url.searchParams.get('platform') as 'ios' | 'android' | undefined;

    // Get data sources information
    const dataSourcesInfo = await unifiedReviewScraper.getDataSourcesInfo(appId, platform);

    // Get statistics
    const statistics = unifiedReviewScraper.getSourcesStatistics();

    return NextResponse.json({
      dataSources: dataSourcesInfo,
      statistics,
      features: {
        unifiedCollection: true,
        qualityAssessment: true,
        intelligentCaching: true,
        rateLimiting: true,
        freeSources: true,
      },
      benefits: [
        '100% free data sources',
        'Up to 2000+ reviews per analysis',
        'Automatic quality assessment',
        'Smart source selection',
        'Intelligent caching system',
        'No API costs',
      ],
      sourceDetails: [
        {
          name: 'App Store RSS Feeds',
          platform: 'iOS',
          quality: 0.8,
          cost: 'Free',
          description: 'Official Apple RSS feeds for real-time review data',
          limitations: 'Limited to 500 reviews, iOS only',
        },
        {
          name: 'Google Play Scraper',
          platform: 'Android',
          quality: 0.7,
          cost: 'Free',
          description: 'Open-source scraper for Google Play Store reviews',
          limitations: 'May require VPN in some regions',
        },
        {
          name: 'Google Play Developer API',
          platform: 'Android',
          quality: 0.95,
          cost: 'Free (requires developer account)',
          description: 'Official Google API with highest data quality',
          limitations: 'Requires Google Play developer account',
        },
        {
          name: 'AppFollowing API',
          platform: 'Both',
          quality: 0.9,
          cost: 'Free (1000 requests/month)',
          description: 'Third-party service with multi-platform support',
          limitations: 'Monthly request limit',
        },
        {
          name: 'Kaggle Datasets',
          platform: 'Both',
          quality: 0.6,
          cost: 'Free',
          description: 'Historical review datasets for research',
          limitations: 'Static historical data only',
        },
      ],
    });

  } catch (error) {
    console.error('Data sources API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources information' },
      { status: 500 }
    );
  }
}