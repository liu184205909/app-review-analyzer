/**
 * Multi-Region and Time-Range Enhanced Scraper
 * 通过多地区和时间范围扩展抓取多样性
 */

interface ScrapingRegion {
  code: string;
  name: string;
  priority: number; // 1=最高优先级
}

interface ScrapingConfig {
  appId: string;
  platform: 'ios' | 'android';
  targetCount: number;
  maxPagesPerRegion: number;
  regions: ScrapingRegion[];
  timeRangeDays: number;
}

// iOS App Store 地区配置
const IOS_REGIONS: ScrapingRegion[] = [
  { code: 'us', name: 'United States', priority: 1 },
  { code: 'gb', name: 'United Kingdom', priority: 2 },
  { code: 'ca', name: 'Canada', priority: 2 },
  { code: 'au', name: 'Australia', priority: 3 },
  { code: 'de', name: 'Germany', priority: 3 },
  { code: 'fr', name: 'France', priority: 3 },
  { code: 'jp', name: 'Japan', priority: 4 },
  { code: 'kr', name: 'South Korea', priority: 4 },
  { code: 'cn', name: 'China', priority: 5 },
  { code: 'in', name: 'India', priority: 5 },
  { code: 'br', name: 'Brazil', priority: 6 },
  { code: 'mx', name: 'Mexico', priority: 6 }
];

// Google Play Store 地区配置
const ANDROID_REGIONS: ScrapingRegion[] = [
  { code: 'en', name: 'English', priority: 1 },
  { code: 'es', name: 'Spanish', priority: 2 },
  { code: 'fr', name: 'French', priority: 2 },
  { code: 'de', name: 'German', priority: 3 },
  { code: 'ja', name: 'Japanese', priority: 3 },
  { code: 'ko', name: 'Korean', priority: 4 },
  { code: 'zh', name: 'Chinese', priority: 4 },
  { code: 'pt', name: 'Portuguese', priority: 5 },
  { code: 'ru', name: 'Russian', priority: 5 },
  { code: 'hi', name: 'Hindi', priority: 6 },
  { code: 'ar', name: 'Arabic', priority: 6 }
];

export async function multiRegionScrape(config: ScrapingConfig): Promise<any[]> {
  const allReviews: any[] = [];
  const regions = config.platform === 'ios' ? IOS_REGIONS : ANDROID_REGIONS;

  // 按优先级排序地区
  const sortedRegions = regions.sort((a, b) => a.priority - b.priority);

  // 计算每个地区的目标数量
  const targetPerRegion = Math.ceil(config.targetCount / sortedRegions.length);

  console.log(`[Multi-Region Scraper] Starting multi-region scrape: ${sortedRegions.length} regions, ${targetPerRegion} reviews per region`);

  for (const region of sortedRegions) {
    try {
      console.log(`[Multi-Region Scraper] Scraping region: ${region.name} (${region.code})`);

      const regionReviews = await scrapeRegion(
        config.appId,
        config.platform,
        region.code,
        targetPerRegion,
        config.maxPagesPerRegion,
        config.timeRangeDays
      );

      if (regionReviews.length > 0) {
        // 添加地区标识
        regionReviews.forEach(review => {
          review.region = region.code;
          review.regionName = region.name;
          review.priority = region.priority;
        });

        allReviews.push(...regionReviews);
        console.log(`[Multi-Region Scraper] Collected ${regionReviews.length} reviews from ${region.name}`);
      }

      // 添加延迟避免被限制
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`[Multi-Region Scraper] Error scraping ${region.name}:`, error);
      // 继续处理其他地区
    }

    // 如果已经收集足够的评论，可以提前退出
    if (allReviews.length >= config.targetCount) {
      console.log(`[Multi-Region Scraper] Target reached: ${allReviews.length} reviews collected`);
      break;
    }
  }

  // 按地区优先级和质量排序
  const sortedReviews = allReviews.sort((a, b) => {
    // 优先级高的地区优先
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 然后按评论质量排序
    return calculateReviewScore(b) - calculateReviewScore(a);
  });

  console.log(`[Multi-Region Scraper] Total collected: ${sortedReviews.length} reviews from ${sortedRegions.length} regions`);
  return sortedReviews.slice(0, config.targetCount);
}

async function scrapeRegion(
  appId: string,
  platform: 'ios' | 'android',
  regionCode: string,
  targetCount: number,
  maxPages: number,
  timeRangeDays: number
): Promise<any[]> {
  const reviews: any[] = [];
  const cutoffDate = new Date(Date.now() - (timeRangeDays * 24 * 60 * 60 * 1000));

  if (platform === 'ios') {
    // iOS App Store 抓取
    for (let page = 1; page <= maxPages && reviews.length < targetCount; page++) {
      try {
        const pageReviews = await fetchAppStoreReviewsByRegion(
          appId,
          regionCode,
          'mostRecent',
          page
        );

        // 过滤时间范围
        const filteredReviews = pageReviews.filter(review => {
          const reviewDate = new Date(review.date || review.createdAt || 0);
          return reviewDate >= cutoffDate;
        });

        reviews.push(...filteredReviews);

        if (pageReviews.length === 0) break; // 没有更多评论

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[Region Scraper] Page ${page} failed for ${regionCode}:`, error);
        break;
      }
    }
  } else {
    // Google Play Store 抓取
    try {
      const playReviews = await fetchGooglePlayReviewsByRegion(appId, {
        num: targetCount,
        sort: 'NEWEST',
        lang: regionCode,
        cutoffDate: cutoffDate.toISOString()
      });

      reviews.push(...playReviews);
    } catch (error) {
      console.error(`[Region Scraper] Android scrape failed for ${regionCode}:`, error);
    }
  }

  return reviews.slice(0, targetCount);
}

// iOS App Store 按地区抓取（需要扩展现有函数）
async function fetchAppStoreReviewsByRegion(
  appId: string,
  country: string,
  sort: 'mostRecent' | 'mostHelpful',
  page: number = 1
): Promise<any[]> {
  // 这里需要扩展现有的fetchAppStoreReviews函数
  // 添加country参数支持

  try {
    // 使用第三方API或直接抓取
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=${sort}/page=${page}/json`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.feed && data.feed.entry) {
      return data.feed.entry.map((entry: any) => ({
        author: entry.author?.name?.label || 'Anonymous',
        rating: parseInt(entry['im:rating']?.label || '0'),
        title: entry.title?.label || '',
        content: entry.content?.label || '',
        date: new Date(entry.updated?.label || Date.now()),
        version: entry['im:version']?.label || '',
        country: country
      }));
    }

    return [];
  } catch (error) {
    console.error(`App Store API error for ${country}:`, error);
    return [];
  }
}

// Android Google Play 按地区抓取
async function fetchGooglePlayReviewsByRegion(
  appId: string,
  options: {
    num?: number;
    sort?: 'NEWEST' | 'RATING' | 'HELPFULNESS';
    lang?: string;
    cutoffDate?: string;
  }
): Promise<any[]> {
  // 这里需要使用现有的fetchGooglePlayReviews函数
  // 添加语言参数支持

  try {
    // 使用google-play-scraper或其他工具
    const gplay = require('google-play-scraper');

    const result = await gplay.reviews({
      appId: appId,
      sort: gplay.sort.NEWEST,
      num: options.num || 100,
      lang: options.lang || 'en'
    });

    // 过滤日期范围
    if (options.cutoffDate) {
      const cutoffDate = new Date(options.cutoffDate);
      return result.data.filter((review: any) => {
        return new Date(review.date) >= cutoffDate;
      });
    }

    return result.data || [];
  } catch (error) {
    console.error(`Google Play API error:`, error);
    return [];
  }
}

function calculateReviewScore(review: any): number {
  let score = 0;

  // 评分多样性加分（非5星1星更有价值）
  if (review.rating >= 2 && review.rating <= 4) score += 2;

  // 内容长度加分
  const contentLength = review.content?.length || 0;
  if (contentLength > 50) score += 1;
  if (contentLength > 100) score += 1;
  if (contentLength > 200) score += 1;

  // 有标题加分
  if (review.title && review.title.trim()) score += 1;

  return score;
}

// 增强的时间范围抓取配置
export interface TimeRangeConfig {
  recentDays: number;    // 最近N天
  mediumDays: number;   // 中等时间范围
  oldDays: number;      // 较老评论
}

export async function timeRangeScrape(
  appId: string,
  platform: 'ios' | 'android',
  timeConfig: TimeRangeConfig,
  targetCount: number
): Promise<any[]> {
  const allReviews: any[] = [];

  // 分配不同时间范围的权重
  const recentWeight = 0.6;  // 60%最近评论
  const mediumWeight = 0.3;  // 30%中等时间评论
  const oldWeight = 0.1;     // 10%较老评论

  const recentTarget = Math.ceil(targetCount * recentWeight);
  const mediumTarget = Math.ceil(targetCount * mediumWeight);
  const oldTarget = targetCount - recentTarget - mediumTarget;

  console.log(`[Time-Range Scraper] Scraping by time ranges: Recent(${timeConfig.recentDays}d): ${recentTarget}, Medium(${timeConfig.mediumDays}d): ${mediumTarget}, Old(${timeConfig.oldDays}d): ${oldTarget}`);

  // 抓取不同时间范围的评论
  const timeRanges = [
    { days: timeConfig.recentDays, target: recentTarget, name: 'Recent' },
    { days: timeConfig.mediumDays, target: mediumTarget, name: 'Medium' },
    { days: timeConfig.oldDays, target: oldTarget, name: 'Old' }
  ];

  for (const timeRange of timeRanges) {
    if (timeRange.target <= 0) continue;

    try {
      console.log(`[Time-Range Scraper] Scraping ${timeRange.name} range (${timeRange.days} days)`);

      const rangeReviews = await scrapeByTimeRange(
        appId,
        platform,
        timeRange.days,
        timeRange.target
      );

      rangeReviews.forEach(review => {
        review.timeRange = timeRange.name;
        review.timeRangeDays = timeRange.days;
      });

      allReviews.push(...rangeReviews);
      console.log(`[Time-Range Scraper] Collected ${rangeReviews.length} reviews from ${timeRange.name} range`);

    } catch (error) {
      console.error(`[Time-Range Scraper] Error scraping ${timeRange.name} range:`, error);
    }
  }

  console.log(`[Time-Range Scraper] Total time-range reviews collected: ${allReviews.length}`);
  return allReviews;
}

async function scrapeByTimeRange(
  appId: string,
  platform: 'ios' | 'android',
  days: number,
  targetCount: number
): Promise<any[]> {
  const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  const maxPages = Math.ceil(targetCount / 50);
  const reviews: any[] = [];

  // 这里实现按时间范围的抓取逻辑
  // 可以使用现有的抓取函数，然后按日期过滤

  if (platform === 'ios') {
    for (let page = 1; page <= maxPages && reviews.length < targetCount; page++) {
      try {
        const pageReviews = await fetchAppStoreReviewsByRegion(
          appId,
          'us', // 默认美国地区
          'mostRecent',
          page
        );

        const filteredReviews = pageReviews.filter(review => {
          const reviewDate = new Date(review.date);
          return reviewDate >= cutoffDate && reviewDate < new Date(Date.now() - ((days - 7) * 24 * 60 * 60 * 1000));
        });

        reviews.push(...filteredReviews);

        if (pageReviews.length === 0) break;

      } catch (error) {
        console.error(`Time range page ${page} failed:`, error);
        break;
      }
    }
  }

  return reviews.slice(0, targetCount);
}