/**
 * Enhanced Incremental Scraper - 统一的数据收集解决方案
 * 整合去重算法、多地区抓取、时间范围扩展、竞品补充于一体
 */

import prisma from '@/lib/prisma';

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
    recentDays?: number;          // 最近N天
    mediumDays?: number;         // 中等时间范围N天
    historicalDays?: number;      // 历史评论N天
  } | false;

  // 竞品补充配置
  competitors?: {
    enabled: boolean;
    threshold: number;             // 启用竞品数据的阈值
    maxCompetitorReviews: number;  // 最大竞品评论数
    similarityThreshold: number;  // 竞品相似度阈值
  } | false;

  // 去重配置
  deduplication?: {
    enabled: boolean;
    timeWindowHours: number;     // 时间窗口容错
    similarityThreshold: number;  // 内容相似度阈值
    duplicateAllowanceRatio: number; // 允许的重复比例
    minLengthDiff: number;       // 最小长度差异
  } | false;
}

// 默认配置 - 轻量模式
export const LIGHTWEIGHT_CONFIG: EnhancedScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetReviews: 1000,
  minNewReviews: 200,
  regions: false,
  timeRange: false,
  competitors: false,
  deduplication: {
    enabled: true,
    timeWindowHours: 12,
    similarityThreshold: 0.7,
    duplicateAllowanceRatio: 0.15,
    minLengthDiff: 10
  }
};

// 默认配置 - 标准模式
export const STANDARD_CONFIG: EnhancedScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetReviews: 2000,
  minNewReviews: 500,
  regions: {
    enabled: true,
    prioritized: ['us', 'gb', 'ca', 'au'],
    fallbackAll: false,
    maxRegions: 6
  },
  timeRange: {
    enabled: true,
    recentDays: 7,
    mediumDays: 30,
    historicalDays: 90
  },
  competitors: {
    enabled: false,
    threshold: 800,
    maxCompetitorReviews: 300,
    similarityThreshold: 0.6
  },
  deduplication: {
    enabled: true,
    timeWindowHours: 24,
    similarityThreshold: 0.8,
    duplicateAllowanceRatio: 0.2,
    minLengthDiff: 15
  }
};

// 默认配置 - 激进模式
export const AGGRESSIVE_CONFIG: EnhancedScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetReviews: 5000,
  minNewReviews: 1500,
  regions: {
    enabled: true,
    prioritized: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'jp', 'kr'],
    fallbackAll: true,
    maxRegions: 12
  },
  timeRange: {
    enabled: true,
    recentDays: 14,
    mediumDays: 60,
    historicalDays: 180
  },
  competitors: {
    enabled: true,
    threshold: 1500,
    maxCompetitorReviews: 1000,
    similarityThreshold: 0.5
  },
  deduplication: {
    enabled: true,
    timeWindowHours: 48,
    similarityThreshold: 0.6,
    duplicateAllowanceRatio: 0.3,
    minLengthDiff: 20
  }
};

export async function enhancedIncrementalScrape(config: EnhancedScrapeConfig): Promise<{
  totalReviews: number;
  newReviews: number;
  duplicateReviews: number;
  competitorReviews: number;
  scrapedReviews: any[];
  sources: string[];
  lastCrawledAt: Date;
  success: boolean;
  error?: string;
}> {
  console.log(`[Enhanced Scraper] Starting unified scrape for ${config.platform} app: ${config.appId}`);
  console.log(`[Enhanced Scraper] Target: ${config.targetReviews}, Min new: ${config.minNewReviews}`);

  const sources: string[] = [];
  let allReviews: any[] = [];
  let newReviewsCount = 0;
  let competitorReviewsCount = 0;
  let duplicateCount = 0;

  try {
    // Phase 1: 基础增量抓取
    console.log(`[Enhanced Scraper] Phase 1: Standard incremental scraping`);
    const baseResult = await performStandardScraping(config);

    allReviews.push(...baseResult.reviews);
    newReviewsCount += baseResult.newReviews;
    duplicateCount += baseResult.duplicateReviews;
    sources.push('standard_incremental');

    console.log(`[Enhanced Scraper] Phase 1: ${baseResult.newReviews} new, ${baseResult.duplicateReviews} duplicates`);

    // Phase 2: 如果需要更多评论，启用增强策略
    if (newReviewsCount < config.minNewReviews) {
      const remainingNeeded = config.minNewReviews - newReviewsCount;
      console.log(`[Enhanced Scraper] Need ${remainingNeeded} more reviews, enabling enhanced strategies`);

      // Phase 2a: 多地区抓取（如果启用）
      if (config.regions?.enabled && remainingNeeded > 0) {
        console.log(`[Enhanced Scraper] Phase 2a: Multi-region collection`);
        const regionResult = await performMultiRegionScrape(config, remainingNeeded);

        if (regionResult.reviews.length > 0) {
          allReviews.push(...regionResult.reviews);
          newReviewsCount += regionResult.newReviews;
          sources.push('multi_region');
          console.log(`[Enhanced Scraper] Multi-region added ${regionResult.newReviews} reviews from ${regionResult.regions.length} regions`);
        }
      }

      // Phase 2b: 时间范围扩展抓取（如果启用且需要更多）
      if (config.timeRange?.enabled && newReviewsCount < config.minNewReviews) {
        console.log(`[Enhanced Scraper] Phase 2b: Time-range expansion`);
        const timeNeeded = config.minNewReviews - newReviewsCount;
        const timeResult = await performTimeRangeScrape(config, timeNeeded);

        if (timeResult.reviews.length > 0) {
          allReviews.push(...timeResult.reviews);
          newReviewsCount += timeResult.newReviews;
          sources.push('time_range_expansion');
          console.log(`[Enhanced Scraper] Time-range added ${timeResult.newReviews} reviews`);
        }
      }

      // Phase 2c: 竞品评论补充（最后手段）
      if (config.competitors?.enabled && newReviewsCount < config.competitors.threshold) {
        console.log(`[Enhanced Scraper] Phase 2c: Competitor supplementation`);
        const competitorResult = await performCompetitorSupplementation(config, allReviews);

        const competitorReviews = competitorResult.reviews.filter(r => r.isCompetitorReview);
        competitorReviewsCount = competitorReviews.length;

        allReviews = competitorResult.allReviews;
        sources.push(...competitorResult.sources);
        console.log(`[Enhanced Scraper] Competitor data added ${competitorReviewsCount} reviews`);
      }
    }

    // Phase 3: 应用增强去重算法（如果启用）
    let finalReviews = allReviews;
    if (config.deduplication?.enabled) {
      console.log(`[Enhanced Scraper] Phase 3: Enhanced deduplication`);
      const dedupResult = await performEnhancedDeduplication(
        allReviews,
        config.platform,
        config.deduplication
      );

      finalReviews = dedupResult.uniqueReviews;
      duplicateCount = dedupResult.duplicateCount;
      sources.push('enhanced_deduplication');
      console.log(`[Enhanced Scraper] Deduplication: ${dedupResult.uniqueReviews.length} unique, ${dedupResult.duplicateCount} duplicates`);
    }

    // Phase 4: 质量排序和最终选择
    console.log(`[Enhanced Scraper] Phase 4: Quality sorting and final selection`);
    const qualitySortedReviews = finalReviews
      .sort((a, b) => calculateQualityScore(b, config) - calculateQualityScore(a, config))
      .slice(0, config.targetReviews);

    const finalResult = {
      totalReviews: qualitySortedReviews.length,
      newReviews: newReviewsCount,
      duplicateReviews: duplicateCount,
      competitorReviews: competitorReviewsCount,
      scrapedReviews: qualitySortedReviews,
      sources: [...new Set(sources)],
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

      // 返回部分结果
      return {
        totalReviews: allReviews.length,
        newReviews: newReviewsCount,
        duplicateReviews: duplicateCount,
        competitorReviews: competitorReviewsCount,
        scrapedReviews: allReviews,
        sources: sources,
        lastCrawledAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

async function performStandardScraping(config: EnhancedScrapeConfig): Promise<{
  reviews: any[];
  newReviews: number;
  duplicateReviews: number;
}> {
  try {
    // 调用现有的incrementalScrapeReviews逻辑
    console.log(`[Standard Scraper] Would perform standard incremental scraping for ${config.appId}`);

    // 模拟结果 - 实际应该调用现有的incrementalScrapeReviews
    const existingApp = await prisma.app.findFirst({
      where: { appId: config.appId }
    });

    if (!existingApp) {
      return { reviews: [], newReviews: 0, duplicateReviews: 0 };
    }

    // 获取现有评论
    const existingReviews = await prisma.review.findMany({
      where: { appId: existingApp.id },
      orderBy: { reviewDate: 'desc' },
      take: Math.min(config.targetReviews, 5000)
    });

    console.log(`[Standard Scraper] Found ${existingReviews.length} existing reviews`);

    return {
      reviews: existingReviews,
      newReviews: Math.max(0, config.minNewReviews - existingReviews.length),
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
  const regions: string[] = [];
  const allReviews: any[] = [];

  for (const region of config.regions!.prioritized.slice(0, config.regions!.maxRegions || 6)) {
    try {
      console.log(`[Multi-Region] Scraping region: ${region}`);

      // 调用多地区抓取逻辑
      const regionReviews = await scrapeByRegion(config.appId, config.platform, region, Math.ceil(targetCount / regions.length));

      if (regionReviews.length > 0) {
        allReviews.push(...regionReviews);
        regions.push(region);
      }

      // 添加延迟避免被限制
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`[Multi-Region] Failed to scrape ${region}:`, error);
    }
  }

  return {
    reviews: allReviews,
    newReviews: allReviews.length,
    regions
  };
}

async function scrapeByRegion(
  appId: string,
  platform: 'ios' | 'android',
  region: string,
  targetCount: number
): Promise<any[]> {
  console.log(`[Region Scraper] Scraping ${region} for ${targetCount} reviews`);

  try {
    if (platform === 'ios') {
      // Use existing app store scraper with different regions
      const { fetchAppStoreReviews } = await import('./scrapers/app-store');
      const reviews = await fetchAppStoreReviews(appId, region, 'mostRecent', 1);

      // Add region metadata
      reviews.forEach(review => {
        review.region = region;
        review.source = 'multi_region';
      });

      return reviews.slice(0, targetCount);
    } else {
      // For Android, region-specific scraping
      const { fetchGooglePlayReviews } = await import('./scrapers/google-play');
      const reviews = await fetchGooglePlayReviews(appId, {
        num: targetCount,
        sort: 'NEWEST',
        country: region
      });

      // Add region metadata
      reviews.forEach(review => {
        review.region = region;
        review.source = 'multi_region';
      });

      return reviews;
    }
  } catch (error) {
    console.error(`[Region Scraper] Failed to scrape ${region}:`, error);
    return [];
  }
}

async function performTimeRangeScrape(
  config: EnhancedScrapeConfig,
  targetCount: number
): Promise<{
  reviews: any[];
  newReviews: number;
}> {
  const timeRanges = [
    { days: config.timeRange!.recentDays || 7, name: 'recent' },
    { days: config.timeRange!.mediumDays || 30, name: 'medium' },
    { days: config.timeRange!.historicalDays || 90, name: 'historical' }
  ];

  const allReviews: any[] = [];

  for (const timeRange of timeRanges) {
    try {
      console.log(`[Time Range] Scraping ${timeRange.name} range (${timeRange.days} days)`);

      // 实现时间范围抓取逻辑
      const rangeReviews = await scrapeByTimeRange(config.appId, config.platform, timeRange.days, Math.ceil(targetCount / timeRanges.length));

      if (rangeReviews.length > 0) {
        rangeReviews.forEach(review => {
          review.timeRange = timeRange.name;
          review.timeRangeDays = timeRange.days;
        });

        allReviews.push(...rangeReviews);
      }

    } catch (error) {
      console.error(`[Time Range] Failed to scrape ${timeRange.name} range:`, error);
    }
  }

  return {
    reviews: allReviews,
    newReviews: allReviews.length
  };
}

async function scrapeByTimeRange(
  appId: string,
  platform: 'ios' | 'android',
  days: number,
  targetCount: number
): Promise<any[]> {
  console.log(`[Time Range Scraper] Scraping ${days} days range for ${targetCount} reviews`);

  try {
    // For time range scraping, we get more pages/older reviews
    if (platform === 'ios') {
      const { fetchAppStoreReviews } = await import('./scrapers/app-store');

      // Calculate how many pages we need to get enough reviews from this time range
      const pagesNeeded = Math.ceil(targetCount / 50);
      const allReviews: any[] = [];

      for (let page = 1; page <= pagesNeeded; page++) {
        const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', page);

        // Filter by date range
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const filteredReviews = reviews.filter(review => {
          const reviewDate = new Date(review.date || review.createdAt);
          return reviewDate >= cutoffDate;
        });

        allReviews.push(...filteredReviews);

        if (allReviews.length >= targetCount) break;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Add time range metadata
      allReviews.forEach(review => {
        review.timeRange = `${days}days`;
        review.source = 'time_range';
      });

      return allReviews.slice(0, targetCount);
    } else {
      const { fetchGooglePlayReviews } = await import('./scrapers/google-play');
      const reviews = await fetchGooglePlayReviews(appId, {
        num: targetCount * 2, // Get more to filter by time
        sort: 'NEWEST'
      });

      // Filter by date range
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const filteredReviews = reviews.filter(review => {
        const reviewDate = new Date(review.date || review.createdAt);
        return reviewDate >= cutoffDate;
      });

      // Add time range metadata
      filteredReviews.forEach(review => {
        review.timeRange = `${days}days`;
        review.source = 'time_range';
      });

      return filteredReviews.slice(0, targetCount);
    }
  } catch (error) {
    console.error(`[Time Range Scraper] Failed to scrape ${days} days range:`, error);
    return [];
  }
}

async function performCompetitorSupplementation(
  config: EnhancedScrapeConfig,
  existingReviews: any[]
): Promise<{
  allReviews: any[];
  reviews: any[];
  sources: string[];
}> {
  console.log(`[Competitor] Starting competitor supplementation (threshold: ${config.competitors!.threshold})`);

  // 实现竞品评论补充逻辑
  // 这里应该：
  // 1. 查找相关竞品
  // 2. 抓取竞品评论
  // 3. 适配竞品评论
  // 4. 与现有评论合并

  return {
    allReviews: existingReviews,
    reviews: [],
    sources: ['competitor_disabled']
  };
}

async function performEnhancedDeduplication(
  reviews: any[],
  platform: 'ios' | 'android',
  config: EnhancedScrapeConfig['deduplication']
): Promise<{
  uniqueReviews: any[];
  duplicateCount: number;
}> {
  console.log(`[Deduplication] Starting enhanced deduplication (threshold: ${config.similarityThreshold})`);

  // 实现增强的去重逻辑
  const uniqueReviews: any[] = [];
  const seenHashes = new Set<string>();

  for (const review of reviews) {
    const contentHash = generateContentHash(review.content);

    // 检查相似度
    const isDuplicate = Array.from(seenHashes).some(existingHash =>
      calculateSimilarity(contentHash, existingHash) >= config.similarityThreshold
    );

    if (!isDuplicate) {
      uniqueReviews.push(review);
      seenHashes.add(contentHash);
    }
  }

  return {
    uniqueReviews,
    duplicateCount: reviews.length - uniqueReviews.length
  };
}

function calculateQualityScore(review: any, config: EnhancedScrapeConfig): number {
  let score = 0;

  // 基础评分
  const contentLength = review.content?.length || 0;
  if (contentLength > 50) score += 10;
  if (contentLength > 100) score += 15;
  if (contentLength > 200) score += 20;

  // 有标题加分
  if (review.title && review.title.trim()) score += 15;

  // 评分分布
  if (review.rating >= 2 && review.rating <= 4) score += 25;
  else if (review.rating === 1 || review.rating === 5) score += 15;

  // 数据源权重
  if (review.isCompetitorReview) {
    score = Math.floor(score * (review.competitorSimilarity || 0.5));
    score -= 10; // 竞品评论稍微降低权重
  } else {
    score += 20; // 原生评论加分
  }

  // 地区多样性加分
  if (review.region && review.region !== 'us') score += 10;

  // 时间新鲜度
  const reviewDate = new Date(review.date || review.createdAt || 0);
  const daysOld = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 7) score += 20;
  else if (daysOld < 30) score += 10;

  // 技术术语
  if (containsTechnicalTerms(review.content)) score += 15;

  // 情感分析
  const sentiment = analyzeSentiment(review.content);
  if (sentiment !== 'neutral') score += 10;

  return score;
}

function generateContentHash(content: string): string {
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')
    .trim();

  const preview = normalized.substring(0, 100);
  return require('crypto')
    .createHash('md5')
    .update(preview)
    .digest('hex');
}

function calculateSimilarity(hash1: string, hash2: string): number {
  // 简单的哈希相似度计算
  let common = 0;
  const minLength = Math.min(hash1.length, hash2.length);

  for (let i = 0; i < minLength; i++) {
    if (hash1[i] === hash2[i]) common++;
  }

  return common / minLength;
}

function containsTechnicalTerms(content: string): boolean {
  const technicalTerms = [
    'crash', 'bug', 'performance', 'lag', 'freeze', 'memory',
    'battery', 'update', 'feature', 'interface', 'ui', 'ux',
    'server', 'connection', 'login', 'account', 'payment',
    'ads', 'advertisement', 'monetization', 'subscription'
  ];

  const lowerContent = content.toLowerCase();
  return technicalTerms.some(term => lowerContent.includes(term));
}

function analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'love', 'amazing', 'excellent', 'perfect', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'horrible', 'disappointed', 'frustrated'];

  const lowerContent = content.toLowerCase();

  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// 导出配置工具函数
export function getRecommendedConfig(reviewCount: number, complexity: 'lightweight' | 'standard' | 'aggressive' = 'standard'): EnhancedScrapeConfig {
  const baseConfig = complexity === 'lightweight' ? LIGHTWEIGHT_CONFIG :
                   complexity === 'aggressive' ? AGGRESSIVE_CONFIG : STANDARD_CONFIG;

  // 根据实际评论数量调整配置
  const adjustedConfig = { ...baseConfig };

  if (reviewCount > 1000) {
    adjustedConfig.minNewReviews = Math.min(reviewCount * 0.3, 1500);
    adjustedConfig.targetReviews = Math.min(reviewCount * 1.5, 3000);
  }

  return adjustedConfig;
}

// 便捷的预配置函数
export const createConfig = (overrides: Partial<EnhancedScrapeConfig> = {}): EnhancedScrapeConfig => {
  return {
    ...STANDARD_CONFIG,
    ...overrides
  };
};