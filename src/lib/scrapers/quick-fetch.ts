// 快速评论抓取（方案A：分离式抓取 - Phase 1）
// 用于快速响应，只抓取少量评论

import { fetchAppStoreReviews } from './app-store';
import { fetchGooglePlayReviews } from './google-play';

/**
 * 快速抓取评论（< 3秒）
 * @param appId App ID  
 * @param platform 平台
 * @param count 抓取数量（默认50）
 */
export async function fetchQuickReviews(
  appId: string,
  platform: 'ios' | 'android',
  count: number = 50
) {
  console.log(`[Quick Fetch] Fetching ${count} reviews for ${platform} app: ${appId}`);
  
  try {
    if (platform === 'ios') {
      // iOS: 抓取第1页（约50条）
      const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', 1);
      return reviews.slice(0, count);
    } else {
      // Android: 抓取指定数量
      const reviews = await fetchGooglePlayReviews(appId, {
        num: Math.min(count, 100), // 最多100条
      });
      return reviews;
    }
  } catch (error) {
    console.error('[Quick Fetch] Error:', error);
    throw error;
  }
}

/**
 * 增量抓取更多评论（后台异步）
 * @param appId App ID
 * @param platform 平台
 * @param currentCount 当前已有评论数
 * @param targetCount 目标评论数
 */
export async function fetchIncrementalReviews(
  appId: string,
  platform: 'ios' | 'android',
  currentCount: number,
  targetCount: number
) {
  console.log(`[Incremental Fetch] Target: ${targetCount}, Current: ${currentCount}`);
  
  const remainingCount = targetCount - currentCount;
  if (remainingCount <= 0) {
    console.log('[Incremental Fetch] Already have enough reviews');
    return [];
  }

  try {
    if (platform === 'ios') {
      // iOS: 计算需要抓取的页数（每页约50条）
      const pagesNeeded = Math.ceil(remainingCount / 50);
      const maxPages = Math.min(pagesNeeded, 10); // 最多10页
      
      console.log(`[Incremental Fetch] iOS: Fetching ${maxPages} pages`);
      
      const allReviews: any[] = [];
      for (let page = 2; page <= maxPages + 1; page++) { // 从第2页开始（第1页已抓取）
        try {
          const reviews = await fetchAppStoreReviews(appId, 'us', 'mostRecent', page);
          if (reviews.length === 0) break;
          allReviews.push(...reviews);
        } catch (error) {
          console.error(`[Incremental Fetch] iOS page ${page} failed:`, error);
          break;
        }
      }
      
      return allReviews.slice(0, remainingCount);
    } else {
      // Android: 直接抓取剩余数量
      console.log(`[Incremental Fetch] Android: Fetching ${remainingCount} reviews`);
      const reviews = await fetchGooglePlayReviews(appId, {
        num: Math.min(remainingCount, 500), // 最多500条
      });
      return reviews;
    }
  } catch (error) {
    console.error('[Incremental Fetch] Error:', error);
    throw error;
  }
}

