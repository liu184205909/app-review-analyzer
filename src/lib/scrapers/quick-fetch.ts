// 快速评论抓取（优化版本 - 增量抓取）
// 集成智能去重、时间戳比较和增量更新

import { fetchAppStoreReviews } from './app-store';
import { fetchGooglePlayReviews } from './google-play';
import { incrementalScrapeReviews, getScrapeStats } from '../incremental-scraper';
import prisma from '../prisma';

/**
 * 智能快速抓取评论（优化版本）
 * 优先使用缓存数据，只在需要时进行增量抓取
 * @param appId App ID
 * @param platform 平台
 * @param count 抓取数量（默认50）
 * @param options 可选参数
 */
export async function fetchQuickReviews(
  appId: string,
  platform: 'ios' | 'android',
  count: number = 50,
  options: {
    forceRefresh?: boolean;
    useIncremental?: boolean;
  } = {}
) {
  const { forceRefresh = false, useIncremental = true } = options;

  console.log(`[Smart Quick Fetch] Request for ${count} reviews of ${platform} app: ${appId}`);
  console.log(`[Smart Quick Fetch] Force refresh: ${forceRefresh}, Use incremental: ${useIncremental}`);

  try {
    // 1. 如果启用了增量抓取且不是强制刷新，先尝试增量抓取
    if (useIncremental && !forceRefresh) {
      console.log(`[Smart Quick Fetch] Trying incremental scrape first...`);

      const incrementalResult = await incrementalScrapeReviews({
        appId,
        platform,
        targetCount: Math.max(count, 100), // 确保有足够的数据
        maxNewReviews: count, // 最多抓取count条新评论
        forceRefresh: false
      });

      if (incrementalResult.totalReviews >= count) {
        console.log(`[Smart Quick Fetch] Using incremental data: ${incrementalResult.totalReviews} total, ${incrementalResult.newReviews} new`);
        return incrementalResult.scrapedReviews.slice(0, count);
      } else {
        console.log(`[Smart Quick Fetch] Insufficient data (${incrementalResult.totalReviews}), falling back to direct scrape...`);
      }
    }

    // 2. 直接抓取（回退方案）
    console.log(`[Smart Quick Fetch] Performing direct scrape...`);

    if (platform === 'ios') {
      // iOS: 抓取第1页（约50条）
      const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', 1);
      return reviews.slice(0, count);
    } else {
      // Android: 抓取指定数量
      const reviews = await fetchGooglePlayReviews(appId, {
        num: Math.min(count, 100), // 最多100条
        sort: 'NEWEST'
      });
      return reviews;
    }
  } catch (error) {
    console.error('[Smart Quick Fetch] Error:', error);
    throw error;
  }
}

/**
 * 兼容性函数 - 保持原有API不变
 * @deprecated 推荐使用 fetchQuickReviews with options
 */
export async function fetchQuickReviewsLegacy(
  appId: string,
  platform: 'ios' | 'android',
  count: number = 50
) {
  return fetchQuickReviews(appId, platform, count, { useIncremental: false });
}

/**
 * 智能增量抓取更多评论（后台异步）
 * 使用新的增量抓取器，自动去重和智能缓存
 * @param appId App ID
 * @param platform 平台
 * @param targetCount 目标评论数
 * @param options 可选参数
 */
export async function fetchIncrementalReviews(
  appId: string,
  platform: 'ios' | 'android',
  targetCount: number = 1000,
  options: {
    forceRefresh?: boolean;
    maxNewReviews?: number;
  } = {}
) {
  const { forceRefresh = false, maxNewReviews = 500 } = options;

  console.log(`[Smart Incremental Fetch] Target: ${targetCount}, Max new: ${maxNewReviews}, Force: ${forceRefresh}`);

  try {
    // 使用新的增量抓取器
    const result = await incrementalScrapeReviews({
      appId,
      platform,
      targetCount,
      maxNewReviews,
      forceRefresh
    });

    console.log(`[Smart Incremental Fetch] Result: ${result.totalReviews} total, ${result.newReviews} new, ${result.duplicateReviews} duplicates`);

    return result.scrapedReviews;

  } catch (error) {
    console.error('[Smart Incremental Fetch] Error:', error);

    // 回退到原来的方法
    console.log('[Smart Incremental Fetch] Falling back to legacy method...');
    return fetchIncrementalReviewsLegacy(appId, platform, 0, targetCount);
  }
}

/**
 * 检查应用是否需要更新
 * @param appId App ID
 * @param platform 平台
 */
export async function checkAppNeedsUpdate(appId: string, platform: 'ios' | 'android') {
  try {
    const stats = await getScrapeStats(appId, platform);
    return stats;
  } catch (error) {
    console.error('[Check Update] Error:', error);
    return {
      totalReviews: 0,
      lastCrawledAt: null,
      needsUpdate: true
    };
  }
}

/**
 * 触发热门应用的定时更新
 * @param limit 更新的应用数量限制
 */
export async function triggerHotAppsUpdate(limit: number = 10) {
  console.log(`[Hot Apps Update] Starting update for top ${limit} apps`);

  try {
    // 获取最近分析的热门应用
    const hotApps = await prisma.analysisTask.findMany({
      where: {
        status: 'completed',
        isLatest: true,
        appStoreId: { not: null },
        platform: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    console.log(`[Hot Apps Update] Found ${hotApps.length} apps to update`);

    const updatePromises = hotApps.map(async (task) => {
      try {
        if (!task.appStoreId || !task.platform) {
          console.log(`[Hot Apps Update] Skipping task with missing data`);
          return null;
        }

        const stats = await checkAppNeedsUpdate(task.appStoreId, task.platform);

        if (stats.needsUpdate) {
          console.log(`[Hot Apps Update] Updating ${task.platform} app: ${task.appStoreId}`);

          // 后台触发增量更新（不等待结果）
          incrementalScrapeReviews({
            appId: task.appStoreId,
            platform: task.platform,
            targetCount: Math.max(stats.totalReviews + 50, 800), // 增加50条或达到800
            maxNewReviews: 100,
            forceRefresh: false
          }).catch(error => {
            console.error(`[Hot Apps Update] Failed to update ${task.appStoreId}:`, error);
          });

          return { success: true, appId: task.appStoreId, platform: task.platform };
        } else {
          return { success: false, appId: task.appStoreId, platform: task.platform, reason: 'recent' };
        }
      } catch (error) {
        console.error(`[Hot Apps Update] Error processing ${task.appStoreId}:`, error);
        return { success: false, appId: task.appStoreId, platform: task.platform, error };
      }
    });

    const results = await Promise.allSettled(updatePromises);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const skipped = results.filter(r => r.status === 'fulfilled' && !r.value?.success).length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Hot Apps Update] Complete: ${successful} updated, ${skipped} skipped, ${failed} failed`);

    return {
      total: hotApps.length,
      successful,
      skipped,
      failed
    };

  } catch (error) {
    console.error('[Hot Apps Update] Error:', error);
    throw error;
  }
}

/**
 * 兼容性函数 - 保持原有API不变
 * @deprecated 推荐使用 fetchIncrementalReviews with options
 */
export async function fetchIncrementalReviewsLegacy(
  appId: string,
  platform: 'ios' | 'android',
  currentCount: number,
  targetCount: number
) {
  console.log(`[Legacy Incremental Fetch] Target: ${targetCount}, Current: ${currentCount}`);

  const remainingCount = targetCount - currentCount;
  if (remainingCount <= 0) {
    console.log('[Legacy Incremental Fetch] Already have enough reviews');
    return [];
  }

  try {
    if (platform === 'ios') {
      const pagesNeeded = Math.ceil(remainingCount / 50);
      const maxPages = Math.min(pagesNeeded, 10);

      console.log(`[Legacy Incremental Fetch] iOS: Fetching ${maxPages} pages`);

      const allReviews: any[] = [];
      for (let page = 2; page <= maxPages + 1; page++) {
        try {
          const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', page);
          if (reviews.length === 0) break;
          allReviews.push(...reviews);
        } catch (error) {
          console.error(`[Legacy Incremental Fetch] iOS page ${page} failed:`, error);
          break;
        }
      }

      return allReviews.slice(0, remainingCount);
    } else {
      console.log(`[Legacy Incremental Fetch] Android: Fetching ${remainingCount} reviews`);
      const reviews = await fetchGooglePlayReviews(appId, {
        num: Math.min(remainingCount, 500),
        sort: 'NEWEST'
      });
      return reviews;
    }
  } catch (error) {
    console.error('[Legacy Incremental Fetch] Error:', error);
    throw error;
  }
}

