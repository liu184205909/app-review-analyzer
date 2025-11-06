'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const ReactWordcloud = dynamic(
  () => import('react-wordcloud').then((mod) => mod.default),
  { ssr: false }
);

interface KeywordData {
  text: string;
  value: number;
  category?: 'issue' | 'feature' | 'positive' | 'negative' | 'neutral';
}

interface KeywordCloudProps {
  keywords: KeywordData[];
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function KeywordCloud({
  keywords,
  title = "Keyword Analysis",
  width = 800,
  height = 400,
  className = ""
}: KeywordCloudProps) {
  // 处理关键词数据
  const processedWords = useMemo(() => {
    let processedKeywords = keywords || [];

    // 如果没有关键词，创建一些默认的示例数据
    if (processedKeywords.length === 0) {
      processedKeywords = [
        { text: 'user', value: 25, category: 'neutral' },
        { text: 'experience', value: 20, category: 'neutral' },
        { text: 'interface', value: 18, category: 'neutral' },
        { text: 'performance', value: 15, category: 'neutral' },
        { text: 'features', value: 12, category: 'neutral' },
        { text: 'design', value: 10, category: 'neutral' },
        { text: 'functionality', value: 8, category: 'neutral' },
        { text: 'quality', value: 7, category: 'neutral' },
      ];
    }

    return processedKeywords
      .filter(word => word.text && word.value > 0)
      .map(word => ({
        text: word.text,
        value: Math.max(word.value, 10), // 最小值确保可见性
        category: word.category || 'neutral'
      }));
  }, [keywords]);

  // 词云配置
  const options = useMemo(() => ({
    rotations: 2,
    rotationAngles: [-90, 0] as [number, number],
    fontSizes: [12, 60] as [number, number],
    fontWeight: 'normal',
    padding: 2,
    spiral: 'archimedean' as const,
    transitionDuration: 1000,
    deterministic: true,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  }), []);

  // 回调函数
  const callbacks = useMemo(() => ({
    onWordClick: (word: any) => {
      console.log('Clicked word:', word.text);
    },
    onWordMouseOver: (word: any) => {
      document.body.style.cursor = 'pointer';
    },
    onWordMouseOut: () => {
      document.body.style.cursor = 'default';
    },
  }), []);

  
  if (processedWords.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">☁️</div>
            <p>No keywords available for analysis</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Click on keywords to see related insights
        </p>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Issues</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Features</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Neutral</span>
        </div>
      </div>

      {/* 词云容器 */}
      <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4" style={{ minHeight: height }}>
        <div style={{ width: '100%', maxWidth: width, height: height }}>
          <ReactWordcloud
            words={processedWords}
            options={options}
            callbacks={callbacks}
          />
        </div>
      </div>

      {/* 关键词统计 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total keywords: {processedWords.length}</span>
          <span>Size indicates frequency</span>
        </div>
      </div>
    </div>
  );
}

// 辅助函数：从分析结果中提取关键词
export function extractKeywordsFromAnalysis(analysis: any): KeywordData[] {
  const keywordMap = new Map<string, KeywordData>();

  // 增强停用词列表
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'will', 'just', 'should', 'now', 'also', 'well', 'get',
    'got', 'have', 'had', 'has', 'having', 'use', 'used', 'using', 'would', 'could',
    'should', 'might', 'must', 'shall', 'may', 'need', 'needs', 'needed', 'want',
    'wants', 'wanted', 'like', 'likes', 'liked', 'make', 'makes', 'made', 'take',
    'takes', 'took', 'taken', 'come', 'comes', 'came', 'going', 'goes', 'went', 'gone',
    'know', 'knows', 'knew', 'known', 'see', 'sees', 'saw', 'seen', 'look', 'looks',
    'looked', 'looking', 'find', 'finds', 'found', 'finding', 'think', 'thinks',
    'thought', 'thinking', 'work', 'works', 'worked', 'working', 'try', 'tries',
    'tried', 'trying', 'feel', 'feels', 'felt', 'feeling', 'seem', 'seems', 'seemed',
    'time', 'way', 'day', 'thing', 'people', 'man', 'woman', 'child', 'world', 'life',
    'hand', 'part', 'eye', 'place', 'case', 'point', 'problem', 'question', 'issue',
    'app', 'application', 'software', 'program', 'system', 'interface', 'option', 'setting',
    'button', 'screen', 'page', 'menu', 'loading', 'error', 'data', 'file', 'image', 'video'
  ]);

  // 应用特定关键词排除
  const appSpecificWords = new Set([
    'instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'snapchat', 'whatsapp',
    'chrome', 'safari', 'firefox', 'edge', 'gmail', 'outlook', 'telegram', 'signal',
    'spotify', 'netflix', 'amazon', 'google', 'apple', 'microsoft', 'zoom', 'teams'
  ]);

  // 重要关键词权重
  const importantKeywords = new Set([
    'crash', 'slow', 'freeze', 'bug', 'lag', 'error', 'fail', 'broken', 'slowly',
    'fast', 'quick', 'smooth', 'responsive', 'stable', 'reliable', 'working', 'fixed',
    'design', 'layout', 'ui', 'ux', 'interface', 'navigation', 'menu', 'search', 'filter',
    'video', 'audio', 'photo', 'image', 'camera', 'quality', 'hd', 'resolution', 'sound',
    'notification', 'alert', 'message', 'chat', 'post', 'share', 'upload', 'download',
    'account', 'login', 'password', 'security', 'privacy', 'storage', 'memory', 'cache'
  ]);

  const extractWords = (text: string, baseWeight: number, category: string) => {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter((word: string) =>
      word.length >= 3 && word.length <= 15 &&
      !stopWords.has(word) &&
      !appSpecificWords.has(word) &&
      !/^\d+$/.test(word) &&
      !/^\d+\w+$/.test(word)
    );

    words.forEach((word: string) => {
      const keywordKey = word;
      const weightMultiplier = importantKeywords.has(word) ? 1.5 : 1;
      const weightedValue = Math.max(Math.ceil(baseWeight * weightMultiplier), 5);

      if (keywordMap.has(keywordKey)) {
        const existing = keywordMap.get(keywordKey)!;
        existing.value += weightedValue;
        const categoryPriority: Record<string, number> = { 'issue': 4, 'feature': 3, 'negative': 2, 'positive': 1, 'neutral': 0 };
        if (categoryPriority[category] > categoryPriority[existing.category as string]) {
          existing.category = category as any;
        }
      } else {
        keywordMap.set(keywordKey, {
          text: word,
          value: weightedValue,
          category: category as any
        });
      }
    });
  };

  if (analysis.criticalIssues) {
    analysis.criticalIssues.forEach((issue: any) => {
      extractWords(issue.title, (issue.frequency || 5) * 2, 'issue');
      if (issue.examples) {
        issue.examples.forEach((example: string) => {
          extractWords(example, (issue.frequency || 2) * 1.5, 'issue');
        });
      }
    });
  }

  if (analysis.experienceIssues) {
    analysis.experienceIssues.forEach((issue: any) => {
      extractWords(issue.title, (issue.frequency || 3) * 1.8, 'issue');
      if (issue.examples) {
        issue.examples.forEach((example: string) => {
          extractWords(example, (issue.frequency || 1) * 1.2, 'issue');
        });
      }
    });
  }

  if (analysis.featureRequests) {
    analysis.featureRequests.forEach((request: any) => {
      extractWords(request.title, (request.frequency || 3) * 1.5, 'feature');
      if (request.examples) {
        request.examples.forEach((example: string) => {
          extractWords(example, (request.frequency || 1) * 1.2, 'feature');
        });
      }
    });
  }

  if (analysis.insights) {
    const insightWords = analysis.insights.split('.');
    insightWords.forEach((sentence: string) => {
      if (sentence.trim()) {
        const text = sentence.toLowerCase();
        let sentiment: string = 'neutral';

        if (text.includes('problem') || text.includes('issue') || text.includes('bug') ||
            text.includes('crash') || text.includes('error') || text.includes('difficult') ||
            text.includes('slow') || text.includes('poor') || text.includes('fail')) {
          sentiment = 'negative';
        } else if (text.includes('great') || text.includes('excellent') || text.includes('good') ||
                   text.includes('love') || text.includes('perfect') || text.includes('amazing')) {
          sentiment = 'positive';
        }

        extractWords(sentence, 1, sentiment);
      }
    });
  }

  const resultKeywords = Array.from(keywordMap.values())
    .sort((a, b) => {
      const categoryPriority: Record<string, number> = { 'issue': 4, 'feature': 3, 'negative': 2, 'positive': 1, 'neutral': 0 };
      const categoryDiff = categoryPriority[b.category as string] - categoryPriority[a.category as string];
      if (categoryDiff !== 0) return categoryDiff;
      return b.value - a.value;
    })
    .slice(0, 60)
    .map(keyword => ({
      ...keyword,
      value: Math.max(keyword.value, 8)
    }));

  if (resultKeywords.length < 10) {
    const defaultKeywords: KeywordData[] = [
      { text: 'performance', value: 15, category: 'neutral' },
      { text: 'usability', value: 12, category: 'neutral' },
      { text: 'features', value: 10, category: 'neutral' },
      { text: 'design', value: 8, category: 'neutral' },
      { text: 'stability', value: 7, category: 'neutral' },
    ];
    resultKeywords.push(...defaultKeywords);
  }

  return resultKeywords;
}