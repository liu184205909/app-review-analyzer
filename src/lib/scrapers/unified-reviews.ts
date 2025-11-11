// Unified Review Scraper - 整合免费评论数据源
// 统一的评论抓取服务，优先使用免费高质量数据源

import {
  fetchAppStoreReviews,
  fetchGooglePlayReviews,
  AppStoreReview,
  GooglePlayReview,
} from './app-store';
import { fetchGooglePlayReviews as fetchGPReviews } from './google-play';

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: Date;
  appVersion: string;
  helpfulVotes?: number;
  platform: 'ios' | 'android';
  country?: string;
  language?: string;
  device?: string;
  source: string; // 数据源标识
}

export interface DataSource {
  name: string;
  platform: 'ios' | 'android' | 'both';
  free: boolean;
  priority: number;
  description: string;
  quality: number;
  available: boolean;
  cost?: string;
}

export interface DataSourceInfo {
  available: string[];
  quality: Record<string, number>;
  costs: Record<string, string>;
  status: Record<string, 'available' | 'unavailable' | 'rate_limited'>;
}

class UnifiedReviewScraper {
  private cache = new Map<string, { data: Review[]; timestamp: number; source: string }>();
  private rateLimiters = new Map<string, { count: number; resetTime: number; limit: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

  // 数据源配置
  private dataSources: DataSource[] = [
    {
      name: 'appstore_rss',
      platform: 'ios',
      free: true,
      priority: 1,
      description: 'App Store RSS Feed',
      quality: 0.8,
      available: true,
      cost: 'Free',
    },
    {
      name: 'google_play_scraper',
      platform: 'android',
      free: true,
      priority: 2,
      description: 'Google Play Scraper',
      quality: 0.7,
      available: true,
      cost: 'Free',
    },
    {
      name: 'google_play_developer_api',
      platform: 'android',
      free: true,
      priority: 3,
      description: 'Google Play Developer API (需要配置)',
      quality: 0.95,
      available: !!process.env.GOOGLE_PLAY_API_KEY,
      cost: 'Free (需要开发者账号)',
    },
    {
      name: 'appfollowing',
      platform: 'both',
      free: true,
      priority: 4,
      description: 'AppFollowing (1000次/月)',
      quality: 0.9,
      available: !!process.env.APPFOLLOWING_API_KEY,
      cost: 'Free (1000次/月)',
    },
    {
      name: 'kaggle_dataset',
      platform: 'both',
      free: true,
      priority: 5,
      description: '公开数据集',
      quality: 0.6,
      available: true,
      cost: 'Free',
    },
  ];

  /**
   * 获取应用评论
   * @param appId 应用ID
   * @param platform 平台
   * @param limit 评论数量限制
   * @param options 额外选项
   */
  async getReviews(
    appId: string,
    platform: 'ios' | 'android',
    limit: number = 100,
    options: {
      country?: string;
      language?: string;
      sortBy?: string;
      deepMode?: boolean;
    } = {}
  ): Promise<{ reviews: Review[]; source: string; quality: number }> {
    const cacheKey = `${platform}:${appId}:${JSON.stringify(options)}:${limit}`;

    // 检查缓存
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log(`[UnifiedScraper] Cache hit for ${appId} (${platform})`);
      return {
        reviews: cached.data,
        source: cached.source,
        quality: this.getAverageQuality([cached.source]),
      };
    }

    // 按优先级获取可用的数据源
    const availableSources = this.getAvailableSources(platform);
    let allReviews: Review[] = [];
    let usedSource = '';
    let totalQuality = 0;

    console.log(`[UnifiedScraper] Fetching reviews for ${appId} (${platform}), sources: ${availableSources.map(s => s.name).join(', ')}`);

    for (const source of availableSources) {
      try {
        if (this.checkRateLimit(source.name)) {
          console.log(`[UnifiedScraper] Trying source: ${source.name}`);
          const sourceReviews = await this.fetchFromSource(source, appId, platform, limit, options);

          if (sourceReviews && sourceReviews.length > 0) {
            // 数据质量评估
            const qualityScore = this.assessDataQuality(sourceReviews);
            console.log(`[UnifiedScraper] ${source.name}: ${sourceReviews.length} reviews, quality: ${qualityScore.toFixed(2)}`);

            // 如果数据质量高，直接返回
            if (qualityScore >= 0.7 && sourceReviews.length >= limit) {
              allReviews = sourceReviews.slice(0, limit);
              usedSource = source.name;
              totalQuality = qualityScore;
              break;
            } else {
              // 数据质量一般或数量不足，继续尝试下一个数据源
              allReviews.push(...sourceReviews);
              if (!usedSource) usedSource = source.name;
              totalQuality = Math.max(totalQuality, qualityScore);
            }
          }
        } else {
          console.log(`[UnifiedScraper] Rate limit exceeded for ${source.name}`);
        }
      } catch (error) {
        console.warn(`[UnifiedScraper] Failed to fetch from ${source.name}:`, error);
        continue;
      }
    }

    // 去重并限制数量
    const uniqueReviews = this.mergeAndDeduplicate(allReviews, limit);
    const finalQuality = this.assessDataQuality(uniqueReviews);

    // 缓存结果
    this.setCachedData(cacheKey, {
      data: uniqueReviews,
      timestamp: Date.now(),
      source: usedSource || 'fallback',
    });

    console.log(`[UnifiedScraper] Final result: ${uniqueReviews.length} unique reviews from ${usedSource || 'multiple sources'}, quality: ${finalQuality.toFixed(2)}`);

    return {
      reviews: uniqueReviews,
      source: usedSource || 'fallback',
      quality: finalQuality,
    };
  }

  /**
   * 获取数据源信息
   */
  async getDataSourcesInfo(appId?: string, platform?: 'ios' | 'android'): Promise<DataSourceInfo> {
    const sources = platform ?
      this.dataSources.filter(source => source.platform === platform || source.platform === 'both') :
      this.dataSources;

    return {
      available: sources.filter(s => s.available).map(s => s.name),
      quality: sources.reduce((acc, s) => ({ ...acc, [s.name]: s.quality }), {}),
      costs: sources.reduce((acc, s) => ({ ...acc, [s.name]: s.cost || 'Unknown' }), {}),
      status: sources.reduce((acc, s) => ({
        ...acc,
        [s.name]: this.getSourceStatus(s.name)
      }), {}),
    };
  }

  /**
   * 获取数据源统计信息
   */
  getSourcesStatistics(): {
    totalSources: number;
    availableSources: number;
    freeSources: number;
    premiumSources: number;
  } {
    const total = this.dataSources.length;
    const available = this.dataSources.filter(s => s.available).length;
    const free = this.dataSources.filter(s => s.free).length;
    const premium = total - free;

    return {
      totalSources: total,
      availableSources: available,
      freeSources: free,
      premiumSources: premium,
    };
  }

  private getAvailableSources(platform: 'ios' | 'android'): DataSource[] {
    return this.dataSources
      .filter(source =>
        source.available &&
        (source.platform === platform || source.platform === 'both') &&
        source.free
      )
      .sort((a, b) => a.priority - b.priority);
  }

  private checkRateLimit(sourceName: string): boolean {
    const limiter = this.rateLimiters.get(sourceName);

    if (!limiter) {
      // 初始化限制器
      const limits: Record<string, { limit: number; resetPeriod: number }> = {
        'appfollowing': { limit: 1000, resetPeriod: 30 * 24 * 60 * 60 * 1000 }, // 30天
        'google_play_developer_api': { limit: 10000, resetPeriod: 30 * 24 * 60 * 60 * 1000 }, // 30天
        'forty_two_matters': { limit: 500, resetPeriod: 30 * 24 * 60 * 60 * 1000 }, // 30天
      };

      const config = limits[sourceName] || { limit: Infinity, resetPeriod: 30 * 24 * 60 * 60 * 1000 };
      this.rateLimiters.set(sourceName, {
        count: 0,
        resetTime: Date.now() + config.resetPeriod,
        limit: config.limit,
      });
      return true;
    }

    // 检查是否需要重置
    if (Date.now() > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }

    return limiter.count < limiter.limit;
  }

  private async fetchFromSource(
    source: DataSource,
    appId: string,
    platform: 'ios' | 'android',
    limit: number,
    options: any
  ): Promise<Review[]> {
    this.incrementRateLimit(source.name);

    switch (source.name) {
      case 'appstore_rss':
        return this.fetchAppStoreRSS(appId, limit, options);
      case 'google_play_scraper':
        return this.fetchGooglePlayReviews(appId, limit, options);
      case 'google_play_developer_api':
        return this.fetchGooglePlayDeveloperAPI(appId, limit, options);
      case 'appfollowing':
        return this.fetchAppFollowingReviews(appId, platform, limit);
      case 'kaggle_dataset':
        return this.fetchKaggleReviews(appId, platform, limit);
      default:
        throw new Error(`Unknown data source: ${source.name}`);
    }
  }

  private async fetchAppStoreRSS(appId: string, limit: number, options: any): Promise<Review[]> {
    try {
      const { fetchAppStoreReviews } = await import('./app-store');
      const reviews = await fetchAppStoreReviews(
        appId,
        options.country || 'us',
        'mostRecent',
        Math.ceil(limit / 50)
      );

      return reviews.map((review: AppStoreReview): Review => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        title: review.title,
        content: review.content,
        date: review.date,
        appVersion: review.appVersion,
        platform: 'ios',
        source: 'appstore_rss',
        country: options.country || 'us',
      }));
    } catch (error) {
      console.error('App Store RSS fetch error:', error);
      throw error;
    }
  }

  private async fetchGooglePlayReviews(appId: string, limit: number, options: any): Promise<Review[]> {
    try {
      const { fetchGooglePlayReviews } = await import('./google-play');
      const reviews = await fetchGooglePlayReviews(appId, {
        country: options.country || 'us',
        lang: options.language || 'en',
        num: Math.min(limit, 500),
        sort: options.sortBy === 'helpful' ? 'HELPFULNESS' : 'NEWEST',
      });

      return reviews.map((review: GooglePlayReview): Review => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        title: review.title || '',
        content: review.content,
        date: review.date,
        appVersion: review.appVersion,
        helpfulVotes: review.thumbsUp,
        platform: 'android',
        source: 'google_play_scraper',
        country: options.country || 'us',
      }));
    } catch (error) {
      console.error('Google Play fetch error:', error);
      throw error;
    }
  }

  private async fetchGooglePlayDeveloperAPI(appId: string, limit: number, options: any): Promise<Review[]> {
    // 模拟Google Play Developer API调用
    // 实际实现需要配置API密钥
    console.warn('Google Play Developer API not implemented - falling back to scraper');
    return this.fetchGooglePlayReviews(appId, limit, options);
  }

  private async fetchAppFollowingReviews(appId: string, platform: 'ios' | 'android', limit: number): Promise<Review[]> {
    // 模拟AppFollowing API调用
    // 实际实现需要配置API密钥
    console.warn('AppFollowing API not implemented - falling back to other sources');
    if (platform === 'ios') {
      return this.fetchAppStoreRSS(appId, limit, {});
    } else {
      return this.fetchGooglePlayReviews(appId, limit, {});
    }
  }

  private async fetchKaggleReviews(appId: string, platform: 'ios' | 'android', limit: number): Promise<Review[]> {
    // 模拟Kaggle数据集调用
    // 实际实现可以加载静态数据集
    console.warn('Kaggle dataset not implemented - empty results');
    return [];
  }

  private assessDataQuality(reviews: Review[]): number {
    if (reviews.length === 0) return 0;

    let score = 0;

    // 内容完整性 (30%)
    const contentCompleteness = reviews.filter(r => r.content && r.content.length > 10).length / reviews.length;
    score += contentCompleteness * 0.3;

    // 评分分布 (20%)
    const hasRating = reviews.filter(r => r.rating > 0).length / reviews.length;
    score += hasRating * 0.2;

    // 时间信息 (20%)
    const hasDate = reviews.filter(r => r.date && r.date.getTime() > 0).length / reviews.length;
    score += hasDate * 0.2;

    // 多样性 (30%)
    const uniqueAuthors = new Set(reviews.map(r => r.author)).size;
    const diversity = Math.min(uniqueAuthors / reviews.length, 1);
    score += diversity * 0.3;

    return score;
  }

  private mergeAndDeduplicate(reviews: Review[], limit: number): Review[] {
    const uniqueReviews = new Map<string, Review>();

    for (const review of reviews) {
      const key = `${review.author}-${review.date.getTime()}-${review.content.substring(0, 100)}`;

      if (!uniqueReviews.has(key)) {
        uniqueReviews.set(key, review);
      }
    }

    return Array.from(uniqueReviews.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private setCachedData(key: string, data: { data: Review[]; timestamp: number; source: string }) {
    this.cache.set(key, data);

    // 限制缓存大小
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  private incrementRateLimit(sourceName: string) {
    const limiter = this.rateLimiters.get(sourceName);
    if (limiter) {
      limiter.count++;
    }
  }

  private getSourceStatus(sourceName: string): 'available' | 'unavailable' | 'rate_limited' {
    const source = this.dataSources.find(s => s.name === sourceName);
    if (!source || !source.available) return 'unavailable';

    if (!this.checkRateLimit(sourceName)) return 'rate_limited';

    return 'available';
  }

  private getAverageQuality(sourceNames: string[]): number {
    const qualities = sourceNames.map(name =>
      this.dataSources.find(s => s.name === name)?.quality || 0
    );
    return qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
  }
}

// 导出单例
export const unifiedReviewScraper = new UnifiedReviewScraper();

// 向后兼容的导出
export { UnifiedReviewScraper };

// 工具函数：提取App Store ID
export function extractAppStoreId(input: string): string | null {
  if (/^\d+$/.test(input)) {
    return input;
  }

  const match = input.match(/\/id(\d+)/);
  return match ? match[1] : null;
}

// 工具函数：提取Google Play ID
export function extractGooglePlayId(input: string): string | null {
  if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(input)) {
    return input;
  }

  const match = input.match(/[?&]id=([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)/i);
  return match ? match[1] : null;
}