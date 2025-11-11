/**
 * Competitor Reviews Data Source Strategy
 * 当目标应用评论不足时，使用竞品评论作为补充数据源
 */

interface CompetitorApp {
  name: string;
  appId: string;
  platform: 'ios' | 'android';
  category: string;
  similarity: number; // 与目标应用的相似度 0-1
  priority: number;   // 数据源优先级
}

interface CompetitorAnalysisConfig {
  targetApp: {
    name: string;
    appId: string;
    platform: 'ios' | 'android';
    category: string;
  };
  minTargetReviews: number;    // 目标应用最少需要的评论数
  maxCompetitorReviews: number; // 最多从竞品获取的评论数
  similarityThreshold: number;  // 竞品相似度阈值
}

// 竞品数据库（示例，实际应该动态查询或配置）
const COMPETITOR_DATABASE: Record<string, CompetitorApp[]> = {
  'Games': [
    { name: 'Archero', appId: '1352471563', platform: 'ios', category: 'Games', similarity: 0.9, priority: 1 },
    { name: 'Soul Knight', appId: '1332649135', platform: 'ios', category: 'Games', similarity: 0.8, priority: 2 },
    { name: 'Brotato', appId: '6448311069', platform: 'ios', category: 'Games', similarity: 0.7, priority: 3 },
    { name: 'Vampire Survivors', appId: '1596935255', platform: 'ios', category: 'Games', similarity: 0.8, priority: 2 },
    { name: 'Hole.io', appId: '1355573593', platform: 'ios', category: 'Games', similarity: 0.6, priority: 4 }
  ],
  'Productivity': [
    { name: 'Notion', appId: '1232780281', platform: 'ios', category: 'Productivity', similarity: 0.7, priority: 1 },
    { name: 'Evernote', appId: '281796108', platform: 'ios', category: 'Productivity', similarity: 0.8, priority: 1 },
    { name: 'Todoist', appId: '1315531665', platform: 'ios', category: 'Productivity', similarity: 0.6, priority: 2 }
  ],
  'Social': [
    { name: 'Instagram', appId: '389801252', platform: 'ios', category: 'Social', similarity: 0.7, priority: 1 },
    { name: 'TikTok', appId: '835599320', platform: 'ios', category: 'Social', similarity: 0.6, priority: 2 },
    { name: 'Snapchat', appId: '447188370', platform: 'ios', category: 'Social', similarity: 0.5, priority: 3 }
  ]
};

export async function getCompetitorEnhancedReviews(
  config: CompetitorAnalysisConfig,
  existingReviews: any[] = []
): Promise<{ reviews: any[], sources: string[] }> {
  console.log(`[Competitor Data] Analyzing competitor opportunities for ${config.targetApp.name}`);

  const targetReviewCount = config.minTargetReviews;
  const currentReviewCount = existingReviews.length;
  const neededReviews = Math.max(0, targetReviewCount - currentReviewCount);

  if (neededReviews === 0) {
    console.log(`[Competitor Data] Sufficient reviews available: ${currentReviewCount}/${targetReviewCount}`);
    return { reviews: existingReviews, sources: ['target_app_only'] };
  }

  console.log(`[Competitor Data] Need ${neededReviews} additional reviews from competitors`);

  // 获取竞品列表
  const competitors = findRelevantCompetitors(config);

  if (competitors.length === 0) {
    console.log(`[Competitor Data] No relevant competitors found for ${config.targetApp.category}`);
    return { reviews: existingReviews, sources: ['target_app_only'] };
  }

  console.log(`[Competitor Data] Found ${competitors.length} potential competitors`);

  const competitorReviews: any[] = [];
  const sources: string[] = ['target_app_only'];

  // 从竞品收集评论
  let remainingNeeded = neededReviews;

  for (const competitor of competitors) {
    if (remainingNeeded <= 0) break;

    const competitorTarget = Math.min(
      Math.ceil(competitor.similarity * remainingNeeded),
      Math.ceil(config.maxCompetitorReviews / competitors.length)
    );

    console.log(`[Competitor Data] Collecting ${competitorTarget} reviews from ${competitor.name} (similarity: ${competitor.similarity})`);

    try {
      const reviews = await scrapeCompetitorReviews(competitor, competitorTarget);

      // 转换竞品评论以适配目标应用
      const adaptedReviews = adaptCompetitorReviews(reviews, competitor, config.targetApp);

      competitorReviews.push(...adaptedReviews);
      sources.push(`competitor_${competitor.name}`);
      remainingNeeded -= adaptedReviews.length;

      console.log(`[Competitor Data] Collected ${adaptedReviews.length} reviews from ${competitor.name}`);

    } catch (error) {
      console.error(`[Competitor Data] Failed to scrape ${competitor.name}:`, error);
    }

    // 添加延迟避免被限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const finalReviews = [...existingReviews, ...competitorReviews].slice(0, targetReviewCount);
  console.log(`[Competitor Data] Final review count: ${finalReviews.length} (target: ${targetReviewCount})`);

  return { reviews: finalReviews, sources };
}

function findRelevantCompetitors(config: CompetitorAnalysisConfig): CompetitorApp[] {
  const categoryCompetitors = COMPETITOR_DATABASE[config.targetApp.category] || [];

  return categoryCompetitors
    .filter(comp => comp.platform === config.targetApp.platform)
    .filter(comp => comp.appId !== config.targetApp.appId) // 排除自己
    .filter(comp => comp.similarity >= config.similarityThreshold)
    .sort((a, b) => {
      // 按相似度和优先级排序
      const scoreA = a.similarity * (10 - a.priority);
      const scoreB = b.similarity * (10 - b.priority);
      return scoreB - scoreA;
    });
}

async function scrapeCompetitorReviews(
  competitor: CompetitorApp,
  targetCount: number
): Promise<any[]> {
  const reviews: any[] = [];
  const maxPages = Math.ceil(targetCount / 50);

  console.log(`[Competitor Scraper] Scraping ${competitor.name} (${competitor.appId})`);

  if (competitor.platform === 'ios') {
    // 使用现有的iOS抓取逻辑
    for (let page = 1; page <= maxPages && reviews.length < targetCount; page++) {
      try {
        const { fetchAppStoreReviews } = await import('./scrapers/app-store');
        const pageReviews = await fetchAppStoreReviews(
          competitor.appId,
          'us',
          'mostRecent',
          page
        );

        reviews.push(...pageReviews);

        if (pageReviews.length === 0) break;

        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error(`[Competitor Scraper] Page ${page} failed for ${competitor.name}:`, error);
        break;
      }
    }
  } else {
    // 使用现有的Android抓取逻辑
    try {
      const gplay = require('google-play-scraper');
      const result = await gplay.reviews({
        appId: competitor.appId,
        sort: gplay.sort.NEWEST,
        num: targetCount,
      });

      reviews.push(...result.data || []);

    } catch (error) {
      console.error(`[Competitor Scraper] Android scrape failed for ${competitor.name}:`, error);
    }
  }

  return reviews.slice(0, targetCount);
}

function adaptCompetitorReviews(
  reviews: any[],
  competitor: CompetitorApp,
  targetApp: CompetitorAnalysisConfig['targetApp']
): any[] {
  return reviews.map(review => {
    const adapted = { ...review };

    // 标记为竞品评论
    adapted.isCompetitorReview = true;
    adapted.competitorName = competitor.name;
    adapted.competitorAppId = competitor.appId;
    adapted.competitorSimilarity = competitor.similarity;

    // 调整内容以适配目标应用上下文
    adapted.content = adaptReviewContent(review.content, competitor, targetApp);
    adapted.title = adaptReviewTitle(review.title, competitor, targetApp);

    // 添加置信度评分
    adapted.confidenceScore = calculateAdaptationConfidence(review, competitor);

    return adapted;
  });
}

function adaptReviewContent(content: string, competitor: CompetitorApp, targetApp: CompetitorAnalysisConfig['targetApp']): string {
  // 将竞品名称替换为目标应用名称
  let adaptedContent = content
    .replace(new RegExp(competitor.name, 'gi'), targetApp.name)
    .replace(new RegExp(competitor.name.toLowerCase(), 'gi'), targetApp.name.toLowerCase());

  // 添加竞品评论标识
  adaptedContent = `[Competitor Insight] ${adaptedContent}`;

  return adaptedContent;
}

function adaptReviewTitle(title: string, competitor: CompetitorApp, targetApp: CompetitorAnalysisConfig['targetApp']): string {
  if (!title) return title;

  return title
    .replace(new RegExp(competitor.name, 'gi'), targetApp.name)
    .replace(new RegExp(competitor.name.toLowerCase(), 'gi'), targetApp.name.toLowerCase());
}

function calculateAdaptationConfidence(review: any, competitor: CompetitorApp): number {
  let confidence = competitor.similarity * 100; // 基础相似度

  // 评论长度影响置信度
  const contentLength = review.content?.length || 0;
  if (contentLength > 50) confidence += 5;
  if (contentLength > 100) confidence += 5;

  // 有标题加分
  if (review.title && review.title.trim()) confidence += 5;

  // 评分极端性（1星或5星）可能更通用
  if (review.rating === 1 || review.rating === 5) confidence += 3;

  return Math.min(confidence, 100);
}

// 竞品分析功能
export interface CompetitorInsights {
  competitorName: string;
  competitorReviews: number;
  averageRating: number;
  commonIssues: string[];
  uniqueFeatures: string[];
  marketPosition: string;
}

export async function analyzeCompetitors(
  targetApp: CompetitorAnalysisConfig['targetApp'],
  competitorApps: CompetitorApp[]
): Promise<CompetitorInsights[]> {
  const insights: CompetitorInsights[] = [];

  for (const competitor of competitorApps.slice(0, 5)) { // 最多分析5个竞品
    try {
      const reviews = await scrapeCompetitorReviews(competitor, 500);

      const insight = analyzeCompetitorReviews(reviews, competitor);
      insights.push(insight);

      console.log(`[Competitor Analysis] Analyzed ${competitor.name}: ${reviews.length} reviews`);

    } catch (error) {
      console.error(`[Competitor Analysis] Failed to analyze ${competitor.name}:`, error);
    }
  }

  return insights;
}

function analyzeCompetitorReviews(reviews: any[], competitor: CompetitorApp): CompetitorInsights {
  const ratingSum = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const averageRating = ratingSum / reviews.length;

  // 简单的关键词分析
  const allText = reviews.map(r => `${r.title || ''} ${r.content || ''}`).join(' ').toLowerCase();

  const commonIssues = extractKeywords(allText, [
    'crash', 'bug', 'slow', 'lag', 'freeze', 'error', 'problem', 'issue'
  ]);

  const uniqueFeatures = extractKeywords(allText, [
    'feature', 'new', 'update', 'design', 'interface', 'cool', 'amazing', 'love'
  ]);

  return {
    competitorName: competitor.name,
    competitorReviews: reviews.length,
    averageRating: Math.round(averageRating * 10) / 10,
    commonIssues,
    uniqueFeatures,
    marketPosition: determineMarketPosition(averageRating, reviews.length, competitor.similarity)
  };
}

function extractKeywords(text: string, keywords: string[]): string[] {
  const found: string[] = [];

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      found.push(keyword);
    }
  }

  return found;
}

function determineMarketPosition(rating: number, reviewCount: number, similarity: number): string {
  if (rating >= 4.5 && reviewCount > 1000) {
    return 'Market Leader';
  } else if (rating >= 4.0 && similarity >= 0.8) {
    return 'Strong Competitor';
  } else if (rating >= 3.5) {
    return 'Market Player';
  } else {
    return 'Niche Product';
  }
}