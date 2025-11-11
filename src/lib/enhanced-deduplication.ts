/**
 * Enhanced Review Deduplication Algorithm
 * 解决过度去重问题，允许更多样性评论进入系统
 */

import prisma from '@/lib/prisma';

interface EnhancedDeduplicationOptions {
  // 时间窗口内的相似评论可以共存
  timeWindowHours?: number;
  // 内容相似度阈值 (0-1)
  contentSimilarityThreshold?: number;
  // 允许一定比例的重复
  duplicateAllowanceRatio?: number;
  // 最小内容长度差异
  minLengthDiff?: number;
}

export async function enhancedDeduplication(
  scrapedReviews: any[],
  existingAppId: number | undefined,
  platform: 'ios' | 'android',
  options: EnhancedDeduplicationOptions = {}
): Promise<{ newReviews: any[], duplicateReviews: any[] }> {

  const {
    timeWindowHours = 24, // 24小时内的相似评论可以共存
    contentSimilarityThreshold = 0.8, // 80%相似度阈值
    duplicateAllowanceRatio = 0.3, // 允许30%的重复
    minLengthDiff = 20 // 最小20个字符差异
  } = options;

  if (!existingAppId) {
    return { newReviews: scrapedReviews, duplicateReviews: [] };
  }

  const newReviews: any[] = [];
  const duplicateReviews: any[] = [];

  // 获取现有评论 - 按时间分组，便于时间窗口检查
  const existingReviews = await prisma.review.findMany({
    where: { appId: existingAppId },
    select: { reviewId: true, content: true, reviewDate: true, author: true },
    orderBy: { reviewDate: 'desc' }
  });

  // 创建内容指纹索引
  const existingContentHashes = new Map<string, any>();
  const existingAuthorContents = new Map<string, Set<string>>();

  for (const review of existingReviews) {
    const contentHash = generateContentHash(review.content);
    existingContentHashes.set(contentHash, review);

    if (!existingAuthorContents.has(review.author)) {
      existingAuthorContents.set(review.author, new Set());
    }
    existingAuthorContents.get(review.author)!.add(review.content);
  }

  // 按重要性排序抓取的评论
  const sortedReviews = scrapedReviews.sort((a, b) => {
    // 优先保留高质量评论
    const scoreA = calculateReviewScore(a);
    const scoreB = calculateReviewScore(b);
    return scoreB - scoreA;
  });

  let allowedDuplicates = Math.floor(scrapedReviews.length * duplicateAllowanceRatio);

  for (const review of sortedReviews) {
    const reviewId = generateReviewId(review, platform);
    const contentHash = generateContentHash(review.content);

    // 检查是否为严格重复
    const isExactDuplicate = existingContentHashes.has(reviewId);

    // 检查内容相似性
    const isSimilarContent = checkContentSimilarity(
      review.content,
      existingContentHashes,
      contentSimilarityThreshold,
      minLengthDiff
    );

    // 检查同一作者的时间窗口
    const isInTimeWindow = checkAuthorTimeWindow(
      review.author,
      review.date || review.createdAt,
      existingAuthorContents,
      timeWindowHours
    );

    // 决定是否接受这条评论
    if (!isExactDuplicate && !isSimilarContent) {
      // 完全新的评论
      addUniqueIdentifier(review, reviewId);
      newReviews.push(review);

      // 更新索引
      existingContentHashes.set(contentHash, review);
      if (!existingAuthorContents.has(review.author)) {
        existingAuthorContents.set(review.author, new Set());
      }
      existingAuthorContents.get(review.author)!.add(review.content);

    } else if (!isExactDuplicate && allowedDuplicates > 0 && !isInTimeWindow) {
      // 允许的相似评论（在时间窗口外）
      addUniqueIdentifier(review, reviewId);
      newReviews.push(review);
      allowedDuplicates--;

    } else {
      // 重复评论
      duplicateReviews.push(review);
    }
  }

  return { newReviews, duplicateReviews };
}

function calculateReviewScore(review: any): number {
  let score = 0;

  // 长度加分
  const contentLength = review.content?.length || 0;
  if (contentLength > 100) score += 2;
  if (contentLength > 200) score += 2;

  // 有标题加分
  if (review.title && review.title.trim()) score += 1;

  // 评分差异加分（非5星1星的详细评论更有价值）
  if (review.rating >= 2 && review.rating <= 4) score += 1;

  // 日期新近性加分
  const reviewDate = new Date(review.date || review.createdAt || 0);
  const daysSinceReview = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReview < 30) score += 1;

  return score;
}

function generateContentHash(content: string): string {
  // 简化内容，移除多余空格和标点
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')
    .trim();

  // 生成前100个字符的哈希
  const preview = normalized.substring(0, 100);
  return require('crypto')
    .createHash('md5')
    .update(preview)
    .digest('hex');
}

function checkContentSimilarity(
  content: string,
  existingHashes: Map<string, any>,
  threshold: number,
  minLengthDiff: number
): boolean {
  const contentHash = generateContentHash(content);

  // 检查精确匹配
  if (existingHashes.has(contentHash)) {
    return true;
  }

  // 检查相似度
  for (const [hash, existingReview] of existingHashes.entries()) {
    const similarity = calculateContentSimilarity(content, existingReview.content);
    if (similarity >= threshold) {
      // 检查长度差异
      const lengthDiff = Math.abs(content.length - existingReview.content.length);
      if (lengthDiff < minLengthDiff) {
        return true;
      }
    }
  }

  return false;
}

function calculateContentSimilarity(content1: string, content2: string): number {
  // 简单的Jaccard相似度计算
  const words1 = new Set(content1.toLowerCase().split(/\s+/));
  const words2 = new Set(content2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

function checkAuthorTimeWindow(
  author: string,
  reviewDate: Date | string,
  authorContents: Map<string, Set<string>>,
  timeWindowHours: number
): boolean {
  if (!authorContents.has(author)) {
    return false;
  }

  const currentReviewTime = new Date(reviewDate).getTime();
  const timeWindowMs = timeWindowHours * 60 * 60 * 1000;

  // 检查该作者在时间窗口内是否有评论
  // 这里简化处理，实际应该检查具体时间
  return false; // 暂时允许所有作者评论
}

function addUniqueIdentifier(review: any, reviewId: string): void {
  review.reviewId = reviewId;
  // 添加时间戳确保唯一性
  review.uniqueTimestamp = Date.now() + Math.random();
}

function generateReviewId(review: any, platform: 'ios' | 'android'): string {
  if (platform === 'ios') {
    return `${review.author || 'anonymous'}_${review.date || review.createdAt || Date.now()}_${review.rating}`;
  } else {
    return `${review.userName || review.author || 'anonymous'}_${review.date || review.createdAt || Date.now()}_${review.score || review.rating}`;
  }
}