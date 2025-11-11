/**
 * True Incremental Scraper
 * 实现真正的增量抓取，避免过度去重，收集更多样化评论
 */

import { enhancedDeduplication } from './enhanced-deduplication';
import { multiRegionScrape, timeRangeScrape } from './multi-region-scraper';
import { getCompetitorEnhancedReviews } from './competitor-data-source';

interface IncrementalScrapeConfig {
  appId: string;
  platform: 'ios' | 'android';
  targetTotalReviews: number;      // 总目标评论数
  minNewReviews: number;           // 最少新评论数
  useMultiRegion: boolean;          // 是否使用多地区
  useTimeRange: boolean;            // 是否使用时间范围
  useCompetitors: boolean;          // 是否使用竞品评论
  competitorThreshold: number;      // 启用竞品评论的阈值
}

interface ScrapeResult {
  totalReviews: number;
  newReviews: number;
  duplicateReviews: number;
  competitorReviews: number;
  scrapedReviews: any[];
  sources: string[];
  lastCrawledAt: Date;
}

export async function trueIncrementalScrape(config: IncrementalScrapeConfig): Promise<ScrapeResult> {
  console.log(`[True Incremental Scraper] Starting enhanced scrape for ${config.platform} app: ${config.appId}`);
  console.log(`[True Incremental Scraper] Target: ${config.targetTotalReviews}, Min new: ${config.minNewReviews}`);

  const sources: string[] = [];
  let allReviews: any[] = [];
  let newReviewsCount = 0;
  let competitorReviewsCount = 0;

  try {
    // 1. 标准增量抓取
    console.log(`[True Incremental Scraper] Phase 1: Standard incremental scrape`);
    const standardResult = await standardIncrementalScrape(config);

    allReviews.push(...standardResult.scrapedReviews);
    newReviewsCount += standardResult.newReviews;
    sources.push(...standardResult.sources);

    console.log(`[True Incremental Scraper] Phase 1 complete: ${standardResult.newReviews} new, ${standardResult.duplicateReviews} duplicates`);

    // 2. 如果新评论不足，启用增强策略
    if (newReviewsCount < config.minNewReviews) {
      const neededMore = config.minNewReviews - newReviewsCount;
      console.log(`[True Incremental Scraper] Need ${neededMore} more reviews, enabling enhanced strategies`);

      // 2a. 多地区抓取
      if (config.useMultiRegion) {
        console.log(`[True Incremental Scraper] Phase 2a: Multi-region scrape`);

        const multiRegionConfig = {
          appId: config.appId,
          platform: config.platform,
          targetCount: neededMore,
          maxPagesPerRegion: 10,
          regions: [], // 使用默认地区
          timeRangeDays: 30
        };

        const regionReviews = await multiRegionScrape(multiRegionConfig);

        if (regionReviews.length > 0) {
          allReviews.push(...regionReviews);
          newReviewsCount += regionReviews.length;
          sources.push('multi_region');
          console.log(`[True Incremental Scraper] Multi-region added ${regionReviews.length} reviews`);
        }
      }

      // 2b. 时间范围扩展抓取
      if (newReviewsCount < config.minNewReviews && config.useTimeRange) {
        console.log(`[True Incremental Scraper] Phase 2b: Time-range扩展抓取`);

        const timeConfig = {
          recentDays: 7,
          mediumDays: 30,
          oldDays: 90
        };

        const timeTarget = config.minNewReviews - newReviewsCount;
        const timeReviews = await timeRangeScrape(
          config.appId,
          config.platform,
          timeConfig,
          timeTarget
        );

        if (timeReviews.length > 0) {
          allReviews.push(...timeReviews);
          newReviewsCount += timeReviews.length;
          sources.push('time_range_extended');
          console.log(`[True Incremental Scraper] Time-range added ${timeReviews.length} reviews`);
        }
      }

      // 2c. 竞品评论补充
      if (newReviewsCount < config.competitorThreshold && config.useCompetitors) {
        console.log(`[True Incremental Scraper] Phase 2c: Competitor data supplementation`);

        const competitorConfig = {
          targetApp: {
            name: 'Target App', // 实际应用名称
            appId: config.appId,
            platform: config.platform,
            category: 'Games' // 实际应用类别
          },
          minTargetReviews: config.targetTotalReviews,
          maxCompetitorReviews: Math.min(500, config.competitorThreshold - newReviewsCount),
          similarityThreshold: 0.6
        };

        const competitorResult = await getCompetitorEnhancedReviews(
          competitorConfig,
          allReviews
        );

        const competitorReviews = competitorResult.reviews.filter(r => r.isCompetitorReview);
        competitorReviewsCount = competitorReviews.length;

        allReviews = competitorResult.reviews;
        sources.push(...competitorResult.sources);

        console.log(`[True Incremental Scraper] Competitor data added ${competitorReviewsCount} reviews`);
      }
    }

    // 3. 最终去重和质量控制
    console.log(`[True Incremental Scraper] Phase 3: Final deduplication and quality control`);

    const finalReviews = await enhancedDeduplication(
      allReviews,
      undefined, // 新应用或忽略现有
      config.platform,
      {
        timeWindowHours: 12, // 12小时内允许相似评论
        contentSimilarityThreshold: 0.7, // 70%相似度阈值
        duplicateAllowanceRatio: 0.2, // 20%允许重复
        minLengthDiff: 15 // 15个字符差异
      }
    );

    // 4. 质量排序和选择
    const qualitySortedReviews = finalReviews.newReviews
      .sort((a, b) => calculateQualityScore(b) - calculateQualityScore(a))
      .slice(0, config.targetTotalReviews);

    const finalResult: ScrapeResult = {
      totalReviews: qualitySortedReviews.length,
      newReviews: finalReviews.newReviews.length,
      duplicateReviews: finalReviews.duplicateReviews.length,
      competitorReviews: competitorReviewsCount,
      scrapedReviews: qualitySortedReviews,
      sources: [...new Set(sources)], // 去重sources
      lastCrawledAt: new Date()
    };

    console.log(`[True Incremental Scraper] Final result:`, {
      totalReviews: finalResult.totalReviews,
      newReviews: finalResult.newReviews,
      duplicateReviews: finalResult.duplicateReviews,
      competitorReviews: finalResult.competitorReviews,
      sources: finalResult.sources
    });

    return finalResult;

  } catch (error) {
    console.error(`[True Incremental Scraper] Error during enhanced scrape:`, error);

    // 返回部分结果
    return {
      totalReviews: allReviews.length,
      newReviews: newReviewsCount,
      duplicateReviews: allReviews.length - newReviewsCount,
      competitorReviews: competitorReviewsCount,
      scrapedReviews: allReviews,
      sources: sources,
      lastCrawledAt: new Date()
    };
  }
}

async function standardIncrementalScrape(config: IncrementalScrapeConfig): Promise<{
  scrapedReviews: any[];
  newReviews: number;
  duplicateReviews: number;
  sources: string[];
}> {
  // 这里使用现有的incrementalScrapeReviews逻辑
  // 但应用enhanced deduplication

  try {
    // 模拟调用现有的scraping逻辑
    const scrapedReviews = await performStandardScraping(config);

    const result = await enhancedDeduplication(
      scrapedReviews,
      undefined,
      config.platform,
      {
        timeWindowHours: 24,
        contentSimilarityThreshold: 0.8,
        duplicateAllowanceRatio: 0.3,
        minLengthDiff: 20
      }
    );

    return {
      scrapedReviews: result.newReviews,
      newReviews: result.newReviews.length,
      duplicateReviews: result.duplicateReviews.length,
      sources: ['standard_incremental']
    };

  } catch (error) {
    console.error('Standard incremental scrape failed:', error);
    return {
      scrapedReviews: [],
      newReviews: 0,
      duplicateReviews: 0,
      sources: []
    };
  }
}

async function performStandardScraping(config: IncrementalScrapeConfig): Promise<any[]> {
  // 这里应该调用现有的抓取逻辑
  // 暂时返回空数组作为占位符
  console.log(`[Standard Scraper] Would scrape ${config.platform} app ${config.appId}`);
  return [];
}

function calculateQualityScore(review: any): number {
  let score = 0;

  // 1. 评论长度 (0-30分)
  const contentLength = review.content?.length || 0;
  if (contentLength > 20) score += 5;
  if (contentLength > 50) score += 5;
  if (contentLength > 100) score += 10;
  if (contentLength > 200) score += 10;

  // 2. 有标题 (0-10分)
  if (review.title && review.title.trim()) {
    score += 10;
  }

  // 3. 评分分布 (0-20分)
  if (review.rating >= 2 && review.rating <= 4) {
    score += 20; // 中等评分通常更有价值
  } else if (review.rating === 1 || review.rating === 5) {
    score += 10; // 极端评分也有价值
  }

  // 4. 语言多样性 (0-10分)
  if (isInternationalContent(review.content)) {
    score += 10;
  }

  // 5. 技术术语 (0-10分)
  if (containsTechnicalTerms(review.content)) {
    score += 10;
  }

  // 6. 情感分析 (0-10分)
  const sentiment = analyzeSentiment(review.content);
  if (sentiment !== 'neutral') {
    score += 10;
  }

  // 7. 数据源权重 (竞品评论降低权重)
  if (review.isCompetitorReview) {
    score = Math.floor(score * review.competitorSimilarity);
  }

  // 8. 时间新鲜度 (0-10分)
  const reviewDate = new Date(review.date || review.createdAt || 0);
  const daysOld = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 7) score += 10;
  else if (daysOld < 30) score += 5;

  return score;
}

function isInternationalContent(content: string): boolean {
  // 简单检测是否包含非英文字符
  const nonEnglishRegex = /[^\x00-\x7F]/;
  return nonEnglishRegex.test(content);
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

// 导出配置和工具函数
export const DEFAULT_SCRAPING_CONFIG: IncrementalScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetTotalReviews: 2000,
  minNewReviews: 500,
  useMultiRegion: true,
  useTimeRange: true,
  useCompetitors: true,
  competitorThreshold: 1000
};

export const LIGHTWEIGHT_SCRAPING_CONFIG: IncrementalScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetTotalReviews: 1000,
  minNewReviews: 200,
  useMultiRegion: false,
  useTimeRange: true,
  useCompetitors: false,
  competitorThreshold: 500
};

export const AGGRESSIVE_SCRAPING_CONFIG: IncrementalScrapeConfig = {
  appId: '',
  platform: 'ios',
  targetTotalReviews: 5000,
  minNewReviews: 1000,
  useMultiRegion: true,
  useTimeRange: true,
  useCompetitors: true,
  competitorThreshold: 1500
};