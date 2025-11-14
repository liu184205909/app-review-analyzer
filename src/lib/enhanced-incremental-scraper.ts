/**
 * Enhanced Incremental Scraper - 统一的数据收集解决方案
 * 整合去重算法、多地区抓取、时间范围扩展、竞品补充于一体
 */

export interface EnhancedScrapeConfig {
  // 基础配置
  appId: string;
  platform: 'ios' | 'android';
  targetReviews: number;           // 目标评论总数
  minNewReviews: number;           // 最少需要的新评论数

  // 多地区配置
  regions?: {
    enabled: boolean;
    prioritized: string[];        // 优先级地区列表
    fallbackAll: boolean;         // 无结果时是否使用所有地区
    maxRegions?: number;          // 最多使用多少个地区
  } | false;

  // 时间范围配置
  timeRange?: {
    enabled: boolean;
    recentDays?: number;          // 最近多少天
    historicalDays?: number;      // 历史多少天
  } | false;

  // 竞品配置
  competitors?: {
    enabled: boolean;
    threshold: number;            // 低于此数量时启用竞品补充
    competitorApps: string[];     // 竞品应用ID列表
  } | false;

  // 去重配置
  deduplication?: {
    enabled: boolean;
    similarityThreshold: number;  // 相似度阈值 (0-1)
    timeWindowDays?: number;      // 时间窗口（天数）
  } | false;
}

export interface EnhancedScrapeResult {
  totalReviews: number;
  newReviews: number;
  duplicateReviews: number;
  competitorReviews: number;
  scrapedReviews: any[];
  sources: string[];
  lastCrawledAt: Date;
  success: boolean;
  error?: string;
}

// 预配置
export const LIGHTWEIGHT_CONFIG: Omit<EnhancedScrapeConfig, 'appId' | 'platform'> = {
  targetReviews: 800,
  minNewReviews: 200,
  deduplication: {
    enabled: true,
    similarityThreshold: 0.8,
    timeWindowDays: 7
  }
};

export const STANDARD_CONFIG: Omit<EnhancedScrapeConfig, 'appId' | 'platform'> = {
  targetReviews: 1500,
  minNewReviews: 500,
  regions: {
    enabled: true,
    prioritized: ['us', 'gb', 'ca', 'au'],
    fallbackAll: true,
    maxRegions: 4
  },
  timeRange: {
    enabled: true,
    recentDays: 30,
    historicalDays: 90
  },
  competitors: {
    enabled: true,
    threshold: 300,
    competitorApps: []
  },
  deduplication: {
    enabled: true,
    similarityThreshold: 0.7,
    timeWindowDays: 14
  }
};

export const AGGRESSIVE_CONFIG: Omit<EnhancedScrapeConfig, 'appId' | 'platform'> = {
  targetReviews: 3000,
  minNewReviews: 1000,
  regions: {
    enabled: true,
    prioritized: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'jp', 'kr'],
    fallbackAll: true,
    maxRegions: 8
  },
  timeRange: {
    enabled: true,
    recentDays: 7,
    historicalDays: 180
  },
  competitors: {
    enabled: true,
    threshold: 500,
    competitorApps: []
  },
  deduplication: {
    enabled: true,
    similarityThreshold: 0.6,
    timeWindowDays: 30
  }
};

/**
 * 增强增量抓取 - 统一的多策略数据收集
 */
export async function enhancedIncrementalScrape(config: EnhancedScrapeConfig): Promise<EnhancedScrapeResult> {
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  console.log(`[Enhanced Scraper] Starting unified scrape for ${config.platform} app: ${config.appId}`);
  console.log(`[Enhanced Scraper] Target: ${config.targetReviews}, Min new: ${config.minNewReviews}`);

  const startTime = Date.now();
  const sources: string[] = [];
  let allReviews: any[] = [];
  let newReviewsCount = 0;
  let duplicateCount = 0;
  let competitorReviewsCount = 0;

  try {
    // Phase 1: Standard scraping
    console.log(`[Enhanced Scraper] Phase 1: Standard scraping`);
    const standardResult = await performStandardScraping(config, prisma);
    allReviews.push(...standardResult.reviews);
    newReviewsCount += standardResult.newReviews;
    sources.push('standard');

    console.log(`[Enhanced Scraper] Phase 1 result: ${standardResult.reviews.length} reviews, ${standardResult.newReviews} new`);

    // Phase 2: Multi-region scraping (if enabled and still need more reviews)
    if (config.regions && config.regions.enabled && allReviews.length < config.targetReviews) {
      console.log(`[Enhanced Scraper] Phase 2: Multi-region scraping`);
      const regionTarget = Math.min(
        config.targetReviews - allReviews.length,
        Math.ceil(config.targetReviews * 0.3)
      );

      const regionResult = await performMultiRegionScrape(config, regionTarget);
      allReviews.push(...regionResult.reviews);
      newReviewsCount += regionResult.newReviews;
      sources.push(...regionResult.regions.map(r => `region_${r}`));

      console.log(`[Enhanced Scraper] Phase 2 result: ${regionResult.reviews.length} reviews from ${regionResult.regions.length} regions`);
    }

    // Phase 3: Time-range expansion (if enabled and still need more reviews)
    if (config.timeRange && config.timeRange.enabled && allReviews.length < config.targetReviews) {
      console.log(`[Enhanced Scraper] Phase 3: Time-range expansion`);
      const timeTarget = Math.min(
        config.targetReviews - allReviews.length,
        Math.ceil(config.targetReviews * 0.2)
      );

      const timeResult = await performTimeRangeScrape(config, timeTarget);
      allReviews.push(...timeResult.reviews);
      newReviewsCount += timeResult.newReviews;
      sources.push('time_range');

      console.log(`[Enhanced Scraper] Phase 3 result: ${timeResult.reviews.length} reviews from time expansion`);
    }

    // Phase 4: Competitor supplementation (if enabled and still need more reviews)
    if (config.competitors && config.competitors.enabled && allReviews.length < config.competitors.threshold) {
      console.log(`[Enhanced Scraper] Phase 4: Competitor supplementation`);
      const competitorTarget = Math.min(
        config.competitors.threshold - allReviews.length,
        Math.ceil(config.targetReviews * 0.15)
      );

      const competitorResult = await performCompetitorSupplementation(config, allReviews, competitorTarget);
      if (competitorResult.reviews.length > 0) {
        allReviews.push(...competitorResult.reviews);
        competitorReviewsCount = competitorResult.reviews.length;
        sources.push('competitors');

        console.log(`[Enhanced Scraper] Phase 4 result: ${competitorResult.reviews.length} competitor reviews`);
      }
    }

    // Phase 5: Enhanced deduplication (if enabled)
    if (config.deduplication && config.deduplication.enabled) {
      console.log(`[Enhanced Scraper] Phase 5: Enhanced deduplication`);
      const { finalReviews, duplicatesRemoved } = await performEnhancedDeduplication(
        allReviews,
        config.deduplication.similarityThreshold,
        (config.deduplication.timeWindowDays || 7)
      );

      duplicateCount = duplicatesRemoved;
      allReviews = finalReviews;

      console.log(`[Enhanced Scraper] Phase 5 result: Removed ${duplicatesRemoved} duplicates, ${finalReviews.length} remaining`);
    }

    // Quality scoring and filtering
    console.log(`[Enhanced Scraper] Phase 6: Quality scoring and filtering`);
    const qualitySortedReviews = await performQualityScoring(allReviews, config.targetReviews);

    const finalResult: EnhancedScrapeResult = {
      totalReviews: qualitySortedReviews.length,
      newReviews: newReviewsCount,
      duplicateReviews: duplicateCount,
      competitorReviews: competitorReviewsCount,
      scrapedReviews: qualitySortedReviews,
      sources: sources,
      lastCrawledAt: new Date(),
      success: qualitySortedReviews.length >= config.minNewReviews
    };

    console.log(`[Enhanced Scraper] Final result:`, {
      totalReviews: finalResult.totalReviews,
      newReviews: finalResult.newReviews,
      duplicateReviews: finalResult.duplicateReviews,
      competitorReviews: finalResult.competitorReviews,
      sources: finalResult.sources,
      success: finalResult.success
    });

    return finalResult;

  } catch (error) {
    console.error(`[Enhanced Scraper] Error during unified scrape:`, error);

    return {
      totalReviews: 0,
      newReviews: 0,
      duplicateReviews: 0,
      competitorReviews: 0,
      scrapedReviews: [],
      sources: ['error'],
      lastCrawledAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function performStandardScraping(config: EnhancedScrapeConfig, prisma: any): Promise<{
  reviews: any[];
  newReviews: number;
  duplicateReviews: number;
}> {
  try {
    console.log(`[Standard Scraper] Performing standard scraping for ${config.appId}`);

    // Get existing reviews from database
    const existingApp = await prisma.app.findFirst({
      where: { appId: config.appId, platform: config.platform }
    });

    if (!existingApp) {
      return { reviews: [], newReviews: 0, duplicateReviews: 0 };
    }

    const existingReviews = await prisma.review.findMany({
      where: { appId: existingApp.id },
      orderBy: { reviewDate: 'desc' },
      take: Math.min(config.targetReviews, 5000)
    });

    console.log(`[Standard Scraper] Found ${existingReviews.length} existing reviews`);

    return {
      reviews: existingReviews,
      newReviews: 0,
      duplicateReviews: 0
    };

  } catch (error) {
    console.error('Standard scraping failed:', error);
    return { reviews: [], newReviews: 0, duplicateReviews: 0 };
  }
}

async function performMultiRegionScrape(
  config: EnhancedScrapeConfig,
  targetCount: number
): Promise<{
  reviews: any[];
  newReviews: number;
  regions: string[];
}> {
  const regions = (config.regions as any).prioritized.slice(0, (config.regions as any).maxRegions || 4);
  const allReviews: any[] = [];
  let totalNew = 0;

  console.log(`[Multi-Region] Targeting ${targetCount} reviews from ${regions.length} regions`);

  for (const region of regions) {
    if (allReviews.length >= targetCount) break;

    try {
      const regionReviews = await scrapeByRegion(config.appId, config.platform, region, Math.ceil(targetCount / regions.length));
      allReviews.push(...regionReviews);
      totalNew += regionReviews.length;

      console.log(`[Multi-Region] ${region}: ${regionReviews.length} reviews`);

      // Delay between regions
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[Multi-Region] Failed for region ${region}:`, error);
    }
  }

  return {
    reviews: allReviews.slice(0, targetCount),
    newReviews: totalNew,
    regions: regions
  };
}

async function performTimeRangeScrape(
  config: EnhancedScrapeConfig,
  targetCount: number
): Promise<{
  reviews: any[];
  newReviews: number;
}> {
  const timeRangeConfig = config.timeRange as any;
const recentDays = timeRangeConfig?.recentDays || 7;
const historicalDays = timeRangeConfig?.historicalDays || 30;
  const allReviews: any[] = [];

  console.log(`[Time-Range] Targeting ${targetCount} reviews from ${recentDays}-${historicalDays} days range`);

  try {
    // Get recent reviews
    const recentReviews = await scrapeByTimeRange(config.appId, config.platform, recentDays, Math.ceil(targetCount * 0.6));
    allReviews.push(...recentReviews);

    // Get historical reviews if needed
    if (allReviews.length < targetCount) {
      const historicalReviews = await scrapeByTimeRange(config.appId, config.platform, historicalDays, targetCount - allReviews.length);
      allReviews.push(...historicalReviews);
    }

    console.log(`[Time-Range] Collected ${allReviews.length} reviews from time expansion`);

    return {
      reviews: allReviews.slice(0, targetCount),
      newReviews: allReviews.length
    };
  } catch (error) {
    console.error('Time range scraping failed:', error);
    return { reviews: [], newReviews: 0 };
  }
}

async function performCompetitorSupplementation(
  config: EnhancedScrapeConfig,
  existingReviews: any[],
  targetCount: number
): Promise<{
  reviews: any[];
}> {
  console.log(`[Competitor] Supplementing with ${targetCount} competitor reviews`);

  // This is a placeholder for competitor data logic
  // In a real implementation, you would:
  // 1. Identify competitor apps in the same category
  // 2. Fetch their reviews
  // 3. Adapt/filter them to be relevant to the target app

  return {
    reviews: [] // Placeholder - no competitor reviews for now
  };
}

async function performEnhancedDeduplication(
  reviews: any[],
  similarityThreshold: number,
  timeWindowDays: number
): Promise<{
  finalReviews: any[];
  duplicatesRemoved: number;
}> {
  console.log(`[Deduplication] Processing ${reviews.length} reviews with threshold ${similarityThreshold}`);

  // Simple deduplication based on reviewId for now
  const seenIds = new Set();
  const uniqueReviews: any[] = [];

  for (const review of reviews) {
    const id = review.reviewId || review.id || `${review.author}_${review.date}_${review.rating}`;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      uniqueReviews.push(review);
    }
  }

  const duplicatesRemoved = reviews.length - uniqueReviews.length;

  console.log(`[Deduplication] Removed ${duplicatesRemoved} duplicates, ${uniqueReviews.length} remaining`);

  return {
    finalReviews: uniqueReviews,
    duplicatesRemoved
  };
}

async function performQualityScoring(reviews: any[], targetCount: number): Promise<any[]> {
  console.log(`[Quality] Scoring and filtering ${reviews.length} reviews to ${targetCount}`);

  // Simple quality scoring based on review length and rating
  const scoredReviews = reviews.map(review => {
    const contentLength = (review.content || '').length;
    const rating = review.rating || 0;

    // Higher score for longer content and extreme ratings (1 or 5)
    let qualityScore = contentLength / 100; // Base score from content length
    if (rating === 1 || rating === 5) {
      qualityScore += 0.5; // Bonus for extreme ratings
    }

    return { ...review, qualityScore };
  });

  // Sort by quality score and take the best ones
  scoredReviews.sort((a, b) => b.qualityScore - a.qualityScore);

  return scoredReviews.slice(0, targetCount);
}

// Helper functions
async function scrapeByRegion(
  appId: string,
  platform: 'ios' | 'android',
  region: string,
  targetCount: number
): Promise<any[]> {
  console.log(`[Region Scraper] Scraping ${region} for ${targetCount} reviews`);

  try {
    if (platform === 'ios') {
      const { fetchAppStoreReviews } = await import('./scrapers/app-store');
      const reviews = await fetchAppStoreReviews(appId, region, 'mostRecent', 1);

      reviews.forEach(review => {
        (review as any).region = region;
        (review as any).source = 'multi_region';
      });

      return reviews.slice(0, targetCount);
    } else {
      const { fetchGooglePlayReviews } = await import('./scrapers/google-play');
      const reviews = await fetchGooglePlayReviews(appId, {
        num: targetCount,
        sort: 'NEWEST',
        country: region
      });

      reviews.forEach(review => {
        (review as any).region = region;
        (review as any).source = 'multi_region';
      });

      return reviews;
    }
  } catch (error) {
    console.error(`[Region Scraper] Failed to scrape ${region}:`, error);
    return [];
  }
}

async function scrapeByTimeRange(
  appId: string,
  platform: 'ios' | 'android',
  days: number,
  targetCount: number
): Promise<any[]> {
  console.log(`[Time Range Scraper] Scraping ${days} days range for ${targetCount} reviews`);

  try {
    if (platform === 'ios') {
      const { fetchAppStoreReviews } = await import('./scrapers/app-store');

      const pagesNeeded = Math.ceil(targetCount / 50);
      const allReviews: any[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', page);

        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const filteredReviews = reviews.filter(review => {
          const reviewDate = new Date(review.date);
          return reviewDate >= cutoffDate;
        });

        allReviews.push(...filteredReviews);

        if (allReviews.length >= targetCount) break;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      allReviews.forEach(review => {
        (review as any).timeRange = `${days}days`;
        (review as any).source = 'time_range';
      });

      return allReviews.slice(0, targetCount);
    } else {
      const { fetchGooglePlayReviews } = await import('./scrapers/google-play');
      const reviews = await fetchGooglePlayReviews(appId, {
        num: targetCount * 2,
        sort: 'NEWEST'
      });

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const filteredReviews = reviews.filter(review => {
        const reviewDate = new Date(review.date);
        return reviewDate >= cutoffDate;
      });

      filteredReviews.forEach(review => {
        (review as any).timeRange = `${days}days`;
        (review as any).source = 'time_range';
      });

      return filteredReviews.slice(0, targetCount);
    }
  } catch (error) {
    console.error(`[Time Range Scraper] Failed to scrape ${days} days range:`, error);
    return [];
  }
}

// Configuration helpers
export function getRecommendedConfig(
  reviewCount: number,
  complexity: 'lightweight' | 'standard' | 'aggressive' = 'standard'
): Omit<EnhancedScrapeConfig, 'appId' | 'platform'> {
  const baseConfig = complexity === 'lightweight' ? LIGHTWEIGHT_CONFIG :
    complexity === 'aggressive' ? AGGRESSIVE_CONFIG : STANDARD_CONFIG;

  const adjustedConfig = { ...baseConfig };

  if (reviewCount > 1000) {
    adjustedConfig.minNewReviews = Math.min(reviewCount * 0.3, 1500);
    adjustedConfig.targetReviews = Math.min(reviewCount * 1.5, 3000);
  }

  return adjustedConfig;
}

export const createConfig = (overrides: Partial<EnhancedScrapeConfig> = {}): EnhancedScrapeConfig => {
  return {
    ...STANDARD_CONFIG,
    ...overrides,
    appId: overrides.appId || '',
    platform: overrides.platform || 'ios'
  };
};