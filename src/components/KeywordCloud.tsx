'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Table, TrendingUp, Filter } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'cloud' | 'chart' | 'table'>('cloud');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  // 过滤后的关键词数据
  const filteredWords = useMemo(() => {
    if (categoryFilter === 'all') return processedWords;
    return processedWords.filter(word => word.category === categoryFilter);
  }, [processedWords, categoryFilter]);

  // 为表格和图表排序的数据
  const sortedWords = useMemo(() => {
    return [...filteredWords].sort((a, b) => b.value - a.value);
  }, [filteredWords]);

  // 按类别统计的数据
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalValue: number; keywords: KeywordData[] }>();

    processedWords.forEach(word => {
      const category = word.category;
      if (!stats.has(category)) {
        stats.set(category, { count: 0, totalValue: 0, keywords: [] });
      }
      const stat = stats.get(category)!;
      stat.count++;
      stat.totalValue += word.value;
      stat.keywords.push(word);
    });

    return Array.from(stats.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalValue: data.totalValue,
      avgValue: Math.round(data.totalValue / data.count),
      keywords: data.keywords.sort((a, b) => b.value - a.value)
    }));
  }, [processedWords]);

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

  
  // 柱状图组件
  const BarChart = ({ data, maxValue }: { data: KeywordData[]; maxValue: number }) => {
    const displayData = data.slice(0, 20); // 显示前20个关键词

    return (
      <div className="w-full">
        <div className="space-y-2">
          {displayData.map((word, index) => {
            const percentage = (word.value / maxValue) * 100;
            const categoryColors: Record<string, string> = {
              issue: 'bg-red-500',
              feature: 'bg-yellow-500',
              positive: 'bg-green-500',
              negative: 'bg-orange-500',
              neutral: 'bg-gray-500'
            };

            return (
              <div key={word.text} className="flex items-center gap-3">
                <div className="w-8 text-right text-sm font-medium text-gray-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {word.text}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({word.value})
                    </span>
                    <div className={`w-2 h-2 rounded-full ${categoryColors[word.category || 'neutral']}`}></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${categoryColors[word.category || 'neutral']}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 表格组件
  const DataTable = ({ data }: { data: KeywordData[] }) => {
    const categoryColors: Record<string, { bg: string; text: string }> = {
      issue: { bg: 'bg-red-100', text: 'text-red-800' },
      feature: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      positive: { bg: 'bg-green-100', text: 'text-green-800' },
      negative: { bg: 'bg-orange-100', text: 'text-orange-800' },
      neutral: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Keyword</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Frequency</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Weight</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 30).map((word, index) => (
              <tr key={word.text} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900 capitalize">{word.text}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categoryColors[word.category || 'neutral']?.bg || 'bg-gray-100'} ${categoryColors[word.category || 'neutral']?.text || 'text-gray-800'}`}>
                    {word.category || 'neutral'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{word.value}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(word.value / Math.max(...data.map(w => w.value))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600">{Math.round((word.value / Math.max(...data.map(w => w.value))) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === 'cloud' ? 'Click on keywords to see related insights' :
               viewMode === 'chart' ? 'Bar chart showing keyword frequency distribution' :
               'Detailed table with keyword statistics and rankings'}
            </p>
          </div>

          {/* 视图切换按钮 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('cloud')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cloud'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Word Cloud View"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 类别筛选 */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({processedWords.length})
            </button>
            {categoryStats.map(stat => (
              <button
                key={stat.category}
                onClick={() => setCategoryFilter(stat.category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === stat.category
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {stat.category} ({stat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
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

      {/* 主要内容区域 */}
      <div className="min-h-[400px]">
        {viewMode === 'cloud' && (
          <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4" style={{ minHeight: height }}>
            <div style={{ width: '100%', maxWidth: width, height: height }}>
              <ReactWordcloud
                words={filteredWords}
                options={options}
                callbacks={callbacks}
              />
            </div>
          </div>
        )}

        {viewMode === 'chart' && (
          <div className="bg-gray-50 rounded-lg p-6" style={{ minHeight: height }}>
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Top Keywords by Frequency
              </h4>
              <p className="text-sm text-gray-600">
                Horizontal bar chart showing the {sortedWords.length} most frequent keywords
              </p>
            </div>
            <BarChart data={sortedWords} maxValue={Math.max(...sortedWords.map(w => w.value))} />
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-gray-50 rounded-lg p-6" style={{ minHeight: height }}>
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Detailed Keyword Analysis
              </h4>
              <p className="text-sm text-gray-600">
                Complete table with rankings, categories, and frequency data
              </p>
            </div>
            <DataTable data={sortedWords} />
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-900">{processedWords.length}</div>
            <div className="text-blue-700">Total Keywords</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-900">{categoryStats.find(s => s.category === 'issue')?.count || 0}</div>
            <div className="text-green-700">Issue Keywords</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="font-semibold text-yellow-900">{categoryStats.find(s => s.category === 'feature')?.count || 0}</div>
            <div className="text-yellow-700">Feature Keywords</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-900">{Math.round(processedWords.reduce((sum, w) => sum + w.value, 0) / processedWords.length)}</div>
            <div className="text-purple-700">Avg Frequency</div>
          </div>
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

  // 常见短语模式匹配
  const phrasePatterns = [
    // 问题相关短语
    { pattern: /\b(app|application|software|program)\s+(crash|crashes|crashing|freez|freezes|freezing|hang|hangs|hanging)\b/i, weight: 2.0, category: 'issue' },
    { pattern: /\b(cannot|can't|unable to|fail|fails|failed|error|errors?)\s+(to\s+)?(login|log in|sign in|signin|access|connect|connect|open|load|loading|start|work|working)\b/i, weight: 2.0, category: 'issue' },
    { pattern: /\b(video|audio|music|song|track|photo|picture|image|camera)\s+(not\s+)?(working|loading|play|plays|playing|load|loads|show|shows|display)\b/i, weight: 1.8, category: 'issue' },
    { pattern: /\b(battery|power|charge|charging)\s+(drain|drains|draining|low|die|dies|dying|fast|quickly|quick)\b/i, weight: 1.8, category: 'issue' },
    { pattern: /\b(slow|slower|slowly|lag|lags|lagging|delay|delays|delayed|stuck|freezing|freeze|hang|hangs)\s+(loading|load|response|respond|start|startup|performance|speed|operating|working)\b/i, weight: 1.8, category: 'issue' },
    { pattern: /\b(notification|notifications|alert|alerts|message|messages)\s+(not\s+)?(working|showing|display|receive|receiving|send|sending|deliver|delivering)\b/i, weight: 1.7, category: 'issue' },
    { pattern: /\b(search|filter|find|look|browse|browse)\s+(not\s+)?(working|function|functioning|load|loading|show|showing|display|result|results)\b/i, weight: 1.7, category: 'issue' },
    { pattern: /\b(update|updates|updating|upgrade|upgrades|upgrading)\s+(not\s+)?(working|fail|fails|failed|install|installing|available|download|downloading)\b/i, weight: 1.7, category: 'issue' },
    { pattern: /\b(login|log in|sign in|signin|password|account|profile)\s+(not\s+)?(working|working|function|access|connect|connecting|load|loading|save|saving)\b/i, weight: 1.7, category: 'issue' },
    { pattern: /\b(server|connection|network|internet|wifi|wi-fi|data)\s+(not\s+)?(working|connected|connecting|available|stable|reliable|fast|slow|error|errors)\b/i, weight: 1.6, category: 'issue' },

    // 正面体验短语
    { pattern: /\b(very|really|extremely|incredibly|amazing|excellent|outstanding|perfect|awesome|fantastic|great|wonderful|brilliant|superb)\s+(good|great|excellent|amazing|fantastic|wonderful|perfect|awesome|outstanding|brilliant)\b/i, weight: 1.5, category: 'positive' },
    { pattern: /\b(fast|quick|rapid|swift|speedy|instant|immediate|responsive|smooth|fluid|seamless|efficient)\s+(loading|load|performance|speed|response|respond|working|operating)\b/i, weight: 1.5, category: 'positive' },
    { pattern: /\b(easy|simple|intuitive|user-friendly|straightforward|convenient|helpful|useful)\s+(to\s+)?(use|navigate|operate|handle|manage|understand|learn|setup|configure)\b/i, weight: 1.4, category: 'positive' },
    { pattern: /\b(high|excellent|great|good|amazing|fantastic|wonderful|perfect|outstanding|superior|quality|premium|top-notch)\s+(quality|design|performance|features|experience|interface|layout|graphics|visuals|audio|sound)\b/i, weight: 1.4, category: 'positive' },

    // 功能请求短语
    { pattern: /\b(need|want|wish|hope|please|add|implement|introduce|include|provide|offer|create|develop|build)\s+(new|additional|extra|more|better|improved)\s+(feature|function|option|setting|tool|capability|ability|functionality)\b/i, weight: 1.5, category: 'feature' },
    { pattern: /\b(should|could|would|might|may|can|will)\s+(have|add|include|offer|provide|support|allow|enable|implement|integrate)\s+(dark|light|custom|multiple|different|various)\s+(mode|theme|style|option|setting|choice)\b/i, weight: 1.4, category: 'feature' },
    { pattern: /\b(add|implement|support|enable|allow|provide|offer|include)\s+(language|languages|translation|translate|multilingual|localization|region|country)\s+(support|option|setting|choice)\b/i, weight: 1.3, category: 'feature' },
    { pattern: /\b(need|want|wish|hope|please|add|implement|create|build)\s+(offline|airplane|no-internet|disconnected)\s+(mode|functionality|capability|access|usage|availability)\b/i, weight: 1.3, category: 'feature' },
    { pattern: /\b(improve|enhance|optimize|upgrade|update|better|faster|quicker|more efficient)\s+(search|filter|sorting|organization|categorization|navigation|menu|interface)\b/i, weight: 1.3, category: 'feature' },
    { pattern: /\b(add|support|enable|allow|integrate|connect|sync|share|export|import)\s+(cloud|backup|sync|social|sharing|collaboration|teamwork|cooperation)\s+(feature|function|capability|service)\b/i, weight: 1.3, category: 'feature' },
  ];

  const extractWords = (text: string, baseWeight: number, category: string) => {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');

    // 1. 首先提取短语 (2-3个单词)
    phrasePatterns.forEach(({ pattern, weight: patternWeight, category: patternCategory }) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const normalizedPhrase = match.toLowerCase().trim();
          if (normalizedPhrase.length >= 6 && normalizedPhrase.length <= 50) { // 短语长度限制
            const finalCategory = patternCategory === 'issue' ? 'issue' :
                                patternCategory === 'positive' ? 'positive' :
                                patternCategory === 'feature' ? 'feature' : category;

            const weightedValue = Math.max(Math.ceil(baseWeight * patternWeight), 8);

            if (keywordMap.has(normalizedPhrase)) {
              const existing = keywordMap.get(normalizedPhrase)!;
              existing.value += weightedValue;
              // 如果短语权重更高，覆盖单字权重
              if (patternWeight > 1.3) {
                existing.value += Math.ceil(weightedValue * 0.5);
              }
            } else {
              keywordMap.set(normalizedPhrase, {
                text: normalizedPhrase,
                value: weightedValue,
                category: finalCategory as any
              });
            }
          }
        });
      }
    });

    // 2. 提取单个关键词（保留原有逻辑，但降低权重）
    const words = cleanText.split(/\s+/).filter((word: string) =>
      word.length >= 4 && word.length <= 15 && // 提高最小长度，减少短词
      !stopWords.has(word) &&
      !appSpecificWords.has(word) &&
      !/^\d+$/.test(word) &&
      !/^\d+\w+$/.test(word)
    );

    words.forEach((word: string) => {
      const keywordKey = word;
      const weightMultiplier = importantKeywords.has(word) ? 1.2 : 0.8; // 降低单字权重
      const weightedValue = Math.max(Math.ceil(baseWeight * weightMultiplier), 3);

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
      // 1. 优先显示短语（包含空格的关键词）
      const aIsPhrase = a.text.includes(' ');
      const bIsPhrase = b.text.includes(' ');
      if (aIsPhrase && !bIsPhrase) return -1;
      if (!aIsPhrase && bIsPhrase) return 1;

      // 2. 按类别优先级排序
      const categoryPriority: Record<string, number> = { 'issue': 4, 'feature': 3, 'negative': 2, 'positive': 1, 'neutral': 0 };
      const categoryDiff = categoryPriority[b.category as string] - categoryPriority[a.category as string];
      if (categoryDiff !== 0) return categoryDiff;

      // 3. 按权重排序
      return b.value - a.value;
    })
    .slice(0, 50) // 减少数量，让短语更突出
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