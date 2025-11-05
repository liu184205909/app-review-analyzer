// Analysis Result Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, TrendingDown, Lightbulb, Target, Download, ChevronDown, ChevronUp } from 'lucide-react';
import ReviewList from '@/components/ReviewList';

interface AnalysisData {
  taskId: string;
  status: string;
  progress: number;
  result?: {
    app: {
      name: string;
      iconUrl: string;
      rating: number;
      reviewCount: number;
    };
    reviewCount: number;
    analyzedCount: number;
    analysis: {
      criticalIssues: Array<{
        title: string;
        frequency: number;
        severity: string;
        examples: string[];
      }>;
      experienceIssues: Array<{
        title: string;
        frequency: number;
        examples: string[];
      }>;
      featureRequests: Array<{
        title: string;
        frequency: number;
        examples: string[];
      }>;
      sentiment: {
        positive: number;
        negative: number;
        neutral: number;
      };
      insights: string;
      priorityActions: string[];
    };
    reviews?: Array<{
      id: string;
      author: string;
      rating: number;
      title?: string;
      content: string;
      date: Date | string;
      appVersion?: string;
    }>;
  };
  error?: string;
}

export default function AnalysisResultPage() {
  const params = useParams();
  const taskId = params.taskId as string; // Can be slug or UUID
  
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try as slug first (if contains hyphen and no UUID format), otherwise as taskId
        const isSlug = taskId.includes('-') && !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const queryParam = isSlug ? `slug=${taskId}` : `taskId=${taskId}`;
        const response = await fetch(`/api/analyze?${queryParam}`);
        const result = await response.json();
        setData(result);
        
        // Poll if still processing
        if (result.status === 'processing' || result.status === 'pending') {
          setTimeout(fetchData, 3000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  // SEO: 动态设置页面标题和描述
  useEffect(() => {
    if (data?.result?.app) {
      const app = data.result.app;
      const platform = data.result.analysis ? 
        (data.result.analysis.sentiment.negative > 50 ? '用户反馈较差' : '用户反馈分析') : '评论分析';
      
      document.title = `${app.name} ${platform} - AI智能分析报告 | ReviewInsight`;
      
      // 设置 meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      const description = `${app.name} 深度评论分析：${data.result.analyzedCount || 0}条评论，发现${data.result.analysis?.criticalIssues?.length || 0}个关键问题。查看完整用户反馈洞察和改进建议。`;
      
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [data]);

  const toggleIssueExpand = (index: number) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Loading state: differentiate between fetching existing vs processing new
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Simple spinner for loading existing result */}
          <div className="mb-6 flex justify-center">
            <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Loading Analysis
          </h2>
          <p className="text-gray-600 text-center">
            Retrieving report...
          </p>
        </div>
      </div>
    );
  }

  // Processing state: show progress for new analysis
  if (!data || data.status === 'processing' || data.status === 'pending') {
    const progress = data?.progress || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Spinner with percentage */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <svg className="animate-spin h-16 w-16 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Title and status */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Analyzing Reviews
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {progress < 30 ? 'Fetching reviews...' : 
             progress < 60 ? 'Processing with AI...' : 
             progress < 90 ? 'Generating insights...' : 'Almost done...'}
          </p>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Estimated time */}
          <p className="text-sm text-center text-gray-500">
            Estimated time: {progress < 50 ? '30-60' : '10-30'} seconds
          </p>
        </div>
      </div>
    );
  }

  if (data.status === 'failed' || !data.result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-gray-600">{data.error || 'Unknown error occurred'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { app, analysis, analyzedCount } = data.result;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">ReviewInsight</a>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* App Info with SEO-optimized H1 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={app.iconUrl} 
              alt={`${app.name} 应用图标`}
              className="w-20 h-20 rounded-xl"
            />
            <div className="flex-1">
              {/* SEO-optimized H1: 长且描述性 */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {app.name} 用户评论分析报告 - {analyzedCount} 条真实反馈深度洞察
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{app.rating.toFixed(1)}</span>
                </span>
                <span>{app.reviewCount.toLocaleString()} 条评论</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                  已分析 {analyzedCount} 条
                </span>
              </div>
            </div>
          </div>
          
          {/* 简短描述（SEO） */}
          <p className="text-gray-600 leading-relaxed">
            本报告基于 AI 深度分析了 {app.name} 的 {analyzedCount} 条用户评论，
            识别出 {analysis.criticalIssues?.length || 0} 个关键问题、
            {analysis.experienceIssues?.length || 0} 个体验问题和
            {analysis.featureRequests?.length || 0} 个功能需求。
            帮助开发者快速了解用户真实反馈，制定产品优化策略。
          </p>
        </div>

        {/* Sentiment Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sentiment Distribution</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.sentiment.positive}%</div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
            <div className="flex-1 bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{analysis.sentiment.neutral}%</div>
              <div className="text-sm text-gray-600">Neutral</div>
            </div>
            <div className="flex-1 bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.sentiment.negative}%</div>
              <div className="text-sm text-gray-600">Negative</div>
            </div>
          </div>
        </div>

        {/* Critical Issues with expandable reviews */}
        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">关键问题</h2>
            </div>
            <p className="text-gray-600 mb-6">
              以下是用户反馈中最严重的问题，需要优先解决以提升用户体验和应用评分。
            </p>
            <div className="space-y-4">
              {analysis.criticalIssues.map((issue, index) => (
                <div key={index} className="border border-red-100 rounded-lg p-4 hover:border-red-200 transition">
                  <div className="flex items-start justify-between mb-3">
                    {/* 移除 H3，使用加粗文本 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{issue.title}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          {issue.frequency} 次提及
                        </span>
                      </div>
                      {issue.severity && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {issue.severity === 'high' ? '严重' : 
                           issue.severity === 'medium' ? '中等' : '轻微'}
                        </span>
                      )}
                    </div>
                    
                    {/* 展开/收起按钮 */}
                    {issue.examples && issue.examples.length > 1 && (
                      <button
                        onClick={() => toggleIssueExpand(index)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedIssues.has(index) ? (
                          <>
                            <span>收起</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>查看 {issue.examples.length} 条评论</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* 示例评论 */}
                  {issue.examples && issue.examples.length > 0 && (
                    <div className="space-y-2">
                      {/* 始终显示第一条 */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                          "{issue.examples[0]}"
                        </p>
                      </div>
                      
                      {/* 展开显示更多 */}
                      {expandedIssues.has(index) && issue.examples.slice(1).map((example, exIndex) => (
                        <div key={exIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 leading-relaxed italic">
                            "{example}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Issues */}
        {analysis.experienceIssues && analysis.experienceIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">体验问题</h2>
            </div>
            <p className="text-gray-600 mb-6">
              用户在使用过程中遇到的体验问题，影响应用的整体使用感受。
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {analysis.experienceIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{issue.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{issue.frequency} 次提及</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Requests */}
        {analysis.featureRequests && analysis.featureRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">功能需求</h2>
            </div>
            <p className="text-gray-600 mb-6">
              用户最希望添加的新功能，这些建议可以帮助产品保持竞争力。
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {analysis.featureRequests.map((request, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{request.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{request.frequency} 次提及</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 关键洞察</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{analysis.insights}</p>
        </div>

        {/* Priority Actions */}
        {analysis.priorityActions && analysis.priorityActions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">优先行动建议</h2>
            </div>
            <p className="text-gray-600 mb-6">
              基于分析结果，以下是我们建议优先解决的行动计划，按重要性排序。
            </p>
            <ol className="space-y-3">
              {analysis.priorityActions.map((action, index) => (
                <li key={index} className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-800 leading-relaxed pt-1">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Typical User Comments */}
        {data.result.reviews && data.result.reviews.length > 0 && (
          <ReviewList reviews={data.result.reviews} appName={app.name} />
        )}
      </main>
    </div>
  );
}

