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
  const keywords: KeywordData[] = [];

  // 常见停用词
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
    'app', 'application', 'software', 'program', 'system', 'feature', 'function',
    'option', 'setting', 'button', 'screen', 'page', 'menu', 'user', 'interface',
    'design', 'layout', 'performance', 'speed', 'loading', 'crash', 'bug', 'error'
  ]);

  // 清理和提取关键词
  const extractWords = (text: string, frequency: number, category: string) => {
    // 移除标点符号并转换为小写
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter((word: string) =>
      word.length > 2 &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // 排除纯数字
    );

    words.forEach((word: string) => {
      keywords.push({
        text: word,
        value: frequency || 1,
        category: category as any
      });
    });
  };

  // 从关键问题中提取关键词
  if (analysis.criticalIssues) {
    analysis.criticalIssues.forEach((issue: any) => {
      extractWords(issue.title, issue.frequency || 1, 'issue');
      // 从示例中提取更多关键词
      if (issue.examples) {
        issue.examples.forEach((example: string) => {
          extractWords(example, (issue.frequency || 1) * 0.5, 'issue'); // 示例权重较低
        });
      }
    });
  }

  // 从体验问题中提取关键词
  if (analysis.experienceIssues) {
    analysis.experienceIssues.forEach((issue: any) => {
      extractWords(issue.title, issue.frequency || 1, 'issue');
      if (issue.examples) {
        issue.examples.forEach((example: string) => {
          extractWords(example, (issue.frequency || 1) * 0.5, 'issue');
        });
      }
    });
  }

  // 从功能请求中提取关键词
  if (analysis.featureRequests) {
    analysis.featureRequests.forEach((request: any) => {
      extractWords(request.title, request.frequency || 1, 'feature');
      if (request.examples) {
        request.examples.forEach((example: string) => {
          extractWords(example, (request.frequency || 1) * 0.5, 'feature');
        });
      }
    });
  }

  // 从洞察中提取关键词（正面和负面）
  if (analysis.insights) {
    const insightWords = analysis.insights.split('.');
    insightWords.forEach((sentence: string) => {
      if (sentence.trim()) {
        const sentiment = sentence.toLowerCase().includes('problem') ||
                         sentence.toLowerCase().includes('issue') ||
                         sentence.toLowerCase().includes('difficult') ? 'negative' : 'positive';
        extractWords(sentence, 1, sentiment);
      }
    });
  }

  // 合并相同的关键词
  const mergedKeywords = keywords.reduce((acc: KeywordData[], current) => {
    const existing = acc.find(k => k.text === current.text);
    if (existing) {
      existing.value += current.value;
      // 如果类别不同，优先使用issue或feature
      if (current.category === 'issue' || current.category === 'feature') {
        existing.category = current.category;
      }
    } else {
      acc.push({ ...current });
    }
    return acc;
  }, []);

  // 按频率排序并返回前50个
  return mergedKeywords
    .sort((a, b) => b.value - a.value)
    .slice(0, 50)
    .map(keyword => ({
      ...keyword,
      value: Math.max(keyword.value, 10) // 确保最小值
    }));
}