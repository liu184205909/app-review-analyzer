// 增量评论采集优化器
// 实现智能去重、时间戳比较和增量更新
// Enhanced with unified multi-strategy approach

import { fetchAppStoreReviews } from './scrapers/app-store';
import { fetchGooglePlayReviews } from './scrapers/google-play';
import { enhancedIncrementalScrape, getRecommendedConfig, LIGHTWEIGHT_CONFIG, STANDARD_CONFIG, AGGRESSIVE_CONFIG, type EnhancedScrapeConfig } from './enhanced-incremental-scraper';

export interface IncrementalScrapeOptions {
  appId: string;
  platform: 'ios' | 'android';
  targetCount?: number; // 目标总评论数
  maxNewReviews?: number; // 本次最多抓取新评论数
  forceRefresh?: boolean; // 是否强制刷新（忽略缓存）
  enhancedMode?: boolean; // 启用增强模式（多地区、时间范围、竞品补充）
  complexity?: 'lightweight' | 'standard' | 'aggressive'; // 增强模式复杂度
}

export interface ScrapeResult {
  totalReviews: number;
  newReviews: number;
  duplicateReviews: number;
  scrapedReviews: any[];
  lastCrawledAt: Date;
  isNewData: boolean;
}

/**
 * 智能增量抓取评论
 * 1. 检查现有评论数量和最后抓取时间
 * 2. 基于时间戳只抓新评论
 * 3. 自动去重和增量存储
 */
export async function incrementalScrapeReviews(options: IncrementalScrapeOptions): Promise<ScrapeResult> {
  const getPrisma = (await import('./prisma')).default;
  const prisma = getPrisma();
  
  const {
    appId,
    platform,
    targetCount = 5000,
    maxNewReviews = 1000,
    forceRefresh = false,
    enhancedMode = false,
    complexity = 'standard'
  } = options;

  console.log(`[Incremental Scraper] Starting for ${platform} app: ${appId}`);
  console.log(`[Incremental Scraper] Target: ${targetCount}, Max new: ${maxNewReviews}, Force refresh: ${forceRefresh}`);
  console.log(`[Incremental Scraper] Enhanced Mode: ${enhancedMode}, Complexity: ${complexity}`);

  // Enhanced Mode: Use unified multi-strategy approach
  // Always use enhanced mode for better data collection
  if (enhancedMode && targetCount >= 500) {
    console.log(`[Incremental Scraper] Using enhanced multi-strategy scraping`);

    // Get recommended configuration based on complexity
    const enhancedConfig = getRecommendedConfig(targetCount, complexity);

    // Create final config with required fields
    const finalConfig: EnhancedScrapeConfig = {
      ...enhancedConfig,
      appId,
      platform,
      targetReviews: targetCount,
      minNewReviews: Math.min(maxNewReviews, targetCount * 0.3) // 30% of target
    } as EnhancedScrapeConfig;

    try {
      const enhancedResult = await enhancedIncrementalScrape(finalConfig);

      console.log(`[Enhanced Scraper] Completed:`, {
        totalReviews: enhancedResult.totalReviews,
        newReviews: enhancedResult.newReviews,
        sources: enhancedResult.sources,
        success: enhancedResult.success
      });

      // Convert to legacy format for compatibility
      return {
        totalReviews: enhancedResult.totalReviews,
        newReviews: enhancedResult.newReviews,
        duplicateReviews: enhancedResult.duplicateReviews,
        scrapedReviews: enhancedResult.scrapedReviews,
        lastCrawledAt: enhancedResult.lastCrawledAt,
        isNewData: enhancedResult.newReviews > 0
      };

    } catch (error) {
      console.error(`[Enhanced Scraper] Failed, falling back to standard mode:`, error);
      // Fall back to standard mode if enhanced fails
    }
  }

  try {
    // 1. 查询现有应用和评论数据
    const existingApp = await prisma.app.findFirst({
      where: { platform, appId },
      include: {
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 10 // 获取最新的10条评论用于时间比较
        }
      }
    });

    const currentReviewCount = existingApp ? await prisma.review.count({
      where: { appId: existingApp.id }
    }) : 0;

    const lastCrawledAt = existingApp?.lastCrawledAt;
    const hasEnoughReviews = currentReviewCount >= targetCount;
    const isRecentlyUpdated = lastCrawledAt &&
      (Date.now() - lastCrawledAt.getTime()) < (24 * 60 * 60 * 1000); // 24小时内

    // 强制重新采集条件：如果当前数据量远低于新目标的一半，触发采集
    const needsSignificantUpdate = currentReviewCount < targetCount * 0.4;

    console.log(`[Incremental Scraper] Current reviews: ${currentReviewCount}, Target: ${targetCount}, Last crawl: ${lastCrawledAt}`);
    console.log(`[Incremental Scraper] Has enough: ${hasEnoughReviews}, Recent: ${isRecentlyUpdated}, Needs significant update: ${needsSignificantUpdate}`);

    // 2. 智能缓存策略 - 如果不需要更新，返回现有数据
    if (!forceRefresh && hasEnoughReviews && isRecentlyUpdated && !needsSignificantUpdate) {
      console.log(`[Incremental Scraper] Using cached data - sufficient and recent`);

      const cachedReviews = await prisma.review.findMany({
        where: { appId: existingApp!.id },
        orderBy: { reviewDate: 'desc' },
        take: Math.min(2000, targetCount) // 返回最多2000条用于分析
      });

      return {
        totalReviews: currentReviewCount,
        newReviews: 0,
        duplicateReviews: 0,
        scrapedReviews: cachedReviews,
        lastCrawledAt: lastCrawledAt!,
        isNewData: false
      };
    }

    // 3. 执行增量抓取
    console.log(`[Incremental Scraper] Performing incremental scrape...`);

    const scrapedReviews = await performScraping(platform, appId, maxNewReviews);
    console.log(`[Incremental Scraper] Scraped ${scrapedReviews.length} raw reviews`);

    // 4. 去重处理
    const { newReviews, duplicateReviews } = await deduplicateReviews(
      scrapedReviews,
      existingApp?.id,
      platform
    );

    console.log(`[Incremental Scraper] After deduplication - New: ${newReviews.length}, Duplicates: ${duplicateReviews.length}`);

    // 5. 保存新评论到数据库
    if (newReviews.length > 0 && existingApp) {
      await saveNewReviews(prisma, newReviews, existingApp.id, platform);

      // 更新应用的最后抓取时间
      await prisma.app.update({
        where: { id: existingApp.id },
        data: { lastCrawledAt: new Date() }
      });
    }

    // 6. 获取最终的评论集合
    const finalReviews = await prisma.review.findMany({
      where: { appId: existingApp!.id },
      orderBy: { reviewDate: 'desc' },
      take: Math.min(2000, targetCount) // 返回用于分析的评论
    });

    const finalCount = await prisma.review.count({
      where: { appId: existingApp!.id }
    });

    return {
      totalReviews: finalCount,
      newReviews: newReviews.length,
      duplicateReviews: duplicateReviews.length,
      scrapedReviews: finalReviews,
      lastCrawledAt: new Date(),
      isNewData: newReviews.length > 0
    };

  } catch (error) {
    console.error(`[Incremental Scraper] Error:`, error);
    throw error;
  }
}

/**
 * 执行实际的抓取操作
 */
async function performScraping(
  platform: 'ios' | 'android',
  appId: string,
  maxCount: number
): Promise<any[]> {
  try {
    if (platform === 'ios') {
      // iOS: 抓取多页评论
      const allReviews: any[] = [];
      const pagesNeeded = Math.ceil(maxCount / 50); // iOS每页约50条
      const maxPages = Math.min(pagesNeeded, 100); // 最多抓100页，确保足够数据生成40-60个问题

      console.log(`[iOS Scraper] Fetching ${maxPages} pages for ${maxCount} reviews`);

      for (let page = 1; page <= maxPages; page++) {
        try {
          const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', page);
          if (reviews.length === 0) break;

          allReviews.push(...reviews);
          console.log(`[iOS Scraper] Page ${page}: ${reviews.length} reviews`);

          // 添加延迟避免被限制
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`[iOS Scraper] Page ${page} failed:`, error);
          break; // 如果某页失败，停止继续抓取
        }
      }

      return allReviews.slice(0, maxCount);

    } else {
      // Android: 使用Google Play抓取器
      console.log(`[Android Scraper] Fetching ${maxCount} reviews`);

      const reviews = await fetchGooglePlayReviews(appId, {
        num: maxCount,
        sort: 'NEWEST' // 获取最新评论
      });

      return reviews.slice(0, maxCount);
    }
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${platform} app:`, error);
    throw error;
  }
}

/**
 * 评论去重处理
 */
async function deduplicateReviews(
  scrapedReviews: any[],
  existingAppId: number | undefined,
  platform: 'ios' | 'android'
): Promise<{ newReviews: any[], duplicateReviews: any[] }> {
  if (!existingAppId) {
    // 新应用，所有评论都是新的
    return { newReviews: scrapedReviews, duplicateReviews: [] };
  }

  const newReviews: any[] = [];
  const duplicateReviews: any[] = [];

  // 获取现有评论的reviewId集合用于快速查找
  const getPrisma = (await import('./prisma')).default;
  const prisma = getPrisma();
  
  const existingReviewIds = new Set(
    (await prisma.review.findMany({
      where: { appId: existingAppId },
      select: { reviewId: true }
    })).map(r => r.reviewId)
  );

  // 按时间排序抓取的评论，优先处理最新的
  const sortedReviews = scrapedReviews.sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  for (const review of sortedReviews) {
    const reviewId = generateReviewId(review, platform);

    if (existingReviewIds.has(reviewId)) {
      duplicateReviews.push(review);
    } else {
      // 添加唯一ID
      review.reviewId = reviewId;
      newReviews.push(review);
    }
  }

  return { newReviews, duplicateReviews };
}

/**
 * 生成评论的唯一ID
 */
function generateReviewId(review: any, platform: 'ios' | 'android'): string {
  if (platform === 'ios') {
    // iOS: 使用id或组合作者+时间+评分生成唯一ID
    return review.id || `${review.author}_${review.date}_${review.rating}`;
  } else {
    // Android: 使用userName或组合其他字段
    return review.userName || `${review.userName}_${review.date}_${review.rating}_${review.text?.slice(0, 50)}`;
  }
}

/**
 * 保存新评论到数据库
 */
async function saveNewReviews(prisma: any, newReviews: any[], appId: number, platform: 'ios' | 'android'): Promise<void> {
  if (newReviews.length === 0) return;

  console.log(`[Database] Saving ${newReviews.length} new reviews`);

  // 批量插入新评论
  const reviewsToInsert = newReviews.map(review => ({
    appId,
    platform: platform, // 使用传入的平台参数
    reviewId: review.reviewId || generateReviewId(review, platform),
    author: review.author || review.userName || 'Anonymous',
    rating: review.rating || 0,
    title: review.title || '',
    content: review.content || review.text || '',
    reviewDate: review.date ? new Date(review.date) : review.reviewDate ? new Date(review.reviewDate) : new Date(),
    appVersion: review.version || review.appVersion || null,
    helpfulCount: review.helpfulCount || review.thumbsUp || 0,
    country: review.country || 'us',
  }));

  // 分批插入，避免单次插入过多数据
  const batchSize = 100;
  for (let i = 0; i < reviewsToInsert.length; i += batchSize) {
    const batch = reviewsToInsert.slice(i, i + batchSize);
    await prisma.review.createMany({
      data: batch,
      skipDuplicates: true // 如果数据库支持，跳过重复项
    });
    console.log(`[Database] Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(reviewsToInsert.length/batchSize)}`);
  }
}

/**
 * 获取应用的抓取统计信息
 */
export async function getScrapeStats(appId: string, platform: 'ios' | 'android') {
  const getPrisma = (await import('./prisma')).default;
  const prisma = getPrisma();
  
  const app = await prisma.app.findFirst({
    where: { platform, appId },
    include: {
      _count: {
        select: { reviews: true }
      }
    }
  });

  if (!app) {
    return {
      totalReviews: 0,
      lastCrawledAt: null,
      needsUpdate: true
    };
  }

  const lastCrawledAt = app.lastCrawledAt;
  const totalReviews = app._count.reviews;
  const needsUpdate = !lastCrawledAt ||
    (Date.now() - lastCrawledAt.getTime()) > (24 * 60 * 60 * 1000); // 24小时

  return {
    totalReviews,
    lastCrawledAt,
    needsUpdate
  };
}

/**
 * 检查评论数据的存储状态（确保数据完整性）
 */
export async function checkReviewStorageStatus(appId: string, platform: 'ios' | 'android') {
  const getPrisma = (await import('./prisma')).default;
  const prisma = getPrisma();
  
  const app = await prisma.app.findFirst({
    where: { platform, appId }
  });

  if (!app) {
    return {
      totalReviews: 0,
      storageStatus: 'app_not_found'
    };
  }

  const totalReviews = await prisma.review.count({
    where: { appId: app.id }
  });

  // 获取最新的几条评论用于验证
  const latestReviews = await prisma.review.findMany({
    where: { appId: app.id },
    orderBy: { reviewDate: 'desc' },
    take: 5,
    select: {
      id: true,
      reviewId: true,
      author: true,
      rating: true,
      reviewDate: true
    }
  });

  return {
    totalReviews,
    storageStatus: 'all_reviews_preserved',
    lastCrawledAt: app.lastCrawledAt,
    platform: app.platform,
    appId: app.appId,
    appInfo: {
      name: app.name,
      lastCrawledAt: app.lastCrawledAt
    },
    latestReviews: latestReviews.map(r => ({
      reviewId: r.reviewId,
      author: r.author,
      rating: r.rating,
      reviewDate: r.reviewDate
    }))
  };
}