// Analysis Result Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, TrendingDown, Lightbulb, Target, Download, ChevronDown, ChevronUp, ExternalLink, MessageSquare } from 'lucide-react';
import ReviewList from '@/components/ReviewList';
import ExportDropdown from '@/components/ExportDropdown';
import { getCategoryDisplay, normalizeCategory } from '@/lib/category';

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
  const [expandedExperienceIssues, setExpandedExperienceIssues] = useState<Set<number>>(new Set());
  const [expandedFeatureRequests, setExpandedFeatureRequests] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try as slug first (if contains hyphen and no UUID format), otherwise as taskId
        const isSlug = taskId.includes('-') && !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const queryParam = isSlug ? `slug=${taskId}` : `taskId=${taskId}`;
        const response = await fetch(`/api/analyze?${queryParam}`);
        const result = await response.json();
        setData(result);
        
        // Poll if still processing - faster polling for better UX
        if (result.status === 'processing' || result.status === 'pending') {
          setTimeout(fetchData, 1500); // Reduced from 3000ms for faster updates
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
      const sentimentText = data.result.analysis ? 
        (data.result.analysis.sentiment.negative > 50 ? 'User Feedback Analysis' : 'Review Analysis') : 'Review Analysis';
      
      document.title = `${app.name} ${sentimentText} | ReviewInsight`;
      
      // 设置 meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      const description = `Deep analysis of ${app.name}: ${data.result.analyzedCount || 0} reviews analyzed, ${data.result.analysis?.criticalIssues?.length || 0} critical issues identified. Get full user feedback insights and improvement recommendations.`;
      
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

  const toggleExperienceIssueExpand = (index: number) => {
    setExpandedExperienceIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleFeatureRequestExpand = (index: number) => {
    setExpandedFeatureRequests(prev => {
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
            {progress < 5 ? 'Initializing analysis...' :
             progress < 15 ? 'Setting up database...' :
             progress < 45 ? 'Fetching reviews from stores...' :
             progress < 60 ? 'Processing and saving reviews...' :
             progress < 70 ? 'Selecting best reviews for analysis...' :
             progress < 85 ? 'Analyzing with AI...' :
             progress < 95 ? 'Generating insights and recommendations...' : 'Finalizing report...'}
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
            {progress < 15 ? 'Estimated time: 2-3 minutes' :
             progress < 45 ? 'Estimated time: 1-2 minutes' :
             progress < 70 ? 'Estimated time: 45-60 seconds' :
             progress < 85 ? 'Estimated time: 20-30 seconds' : 'Almost done...'}
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
  
  // Get category display info
  const appCategory = (app as any).category || null;
  const categoryDisplay = appCategory ? getCategoryDisplay(appCategory) : null;
  const normalizedCategory = appCategory ? normalizeCategory(appCategory) : null;
  const browseCategoryUrl = normalizedCategory ? `/browse?category=${encodeURIComponent(normalizedCategory)}&platform=${(data.result as any).app?.platform || 'all'}` : '/browse';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">ReviewInsight</a>
          <div className="flex gap-4">
            <ExportDropdown analysisData={data} appName={app.name} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* App Info with SEO-optimized H1 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={app.iconUrl} 
              alt={`${app.name} app icon`}
              className="w-20 h-20 rounded-xl"
            />
            <div className="flex-1">
              {/* SEO-optimized H1: 长且描述性 */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {app.name} User Review Analysis Report
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{app.rating.toFixed(1)}</span>
                </span>
                <span>{app.reviewCount.toLocaleString()} reviews</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                  {analyzedCount} analyzed
                </span>
                {/* Category Badge */}
                {categoryDisplay && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium flex items-center gap-1">
                    <span>{categoryDisplay.icon}</span>
                    <span>{categoryDisplay.name}</span>
                  </span>
                )}
              </div>
              {/* View Similar Apps Link */}
              {categoryDisplay && (
                <div className="mt-2">
                  <a
                    href={browseCategoryUrl}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    <span>View more {categoryDisplay.name} apps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* 简短描述（SEO） */}
          <p className="text-gray-600 leading-relaxed">
            This report provides an AI-powered deep analysis of {analyzedCount} user reviews for {app.name},
            identifying {analysis.criticalIssues?.length || 0} critical issues,
            {analysis.experienceIssues?.length || 0} experience problems, and
            {analysis.featureRequests?.length || 0} feature requests.
            Help developers quickly understand real user feedback and develop product optimization strategies.
          </p>
        </div>

        {/* Sentiment Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sentiment Distribution</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((analysis.sentiment.positive / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Positive</div>
              <div className="text-xs text-gray-500 mt-1">{analysis.sentiment.positive} reviews</div>
            </div>
            <div className="flex-1 bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round((analysis.sentiment.neutral / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Neutral</div>
              <div className="text-xs text-gray-500 mt-1">{analysis.sentiment.neutral} reviews</div>
            </div>
            <div className="flex-1 bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Math.round((analysis.sentiment.negative / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Negative</div>
              <div className="text-xs text-gray-500 mt-1">{analysis.sentiment.negative} reviews</div>
            </div>
          </div>
          {/* Progress bar visualization */}
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(analysis.sentiment.positive / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100}%` }}
              />
              <div
                className="bg-gray-400 transition-all duration-500"
                style={{ width: `${(analysis.sentiment.neutral / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(analysis.sentiment.negative / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100}%` }}
              />
            </div>
          </div>
        </div>

    
        {/* Critical Issues with expandable reviews */}
        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Critical Issues</h2>
            </div>
            <p className="text-gray-600 mb-6">
              The most serious problems identified in user feedback that need to be prioritized to improve user experience and app ratings.
            </p>
            <div className="space-y-3">
              {analysis.criticalIssues.map((issue, index) => (
                <div key={index} className="bg-red-50/80 rounded-lg p-3 border border-red-200/60">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{issue.title}</span>

                    {/* Comments Count Button */}
                    {issue.examples && issue.examples.length > 0 && (
                      <button
                        onClick={() => toggleIssueExpand(index)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {issue.examples.length}
                      </button>
                    )}
                  </div>

                  {/* Comments - Expandable */}
                  {expandedIssues.has(index) && issue.examples && issue.examples.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {issue.examples.map((example, exIndex) => (
                        <div key={exIndex} className="bg-white p-3 rounded border border-gray-200">
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

        {/* Experience Issues & Feature Requests - Two Column Layout */}
        {(analysis.experienceIssues && analysis.experienceIssues.length > 0) ||
         (analysis.featureRequests && analysis.featureRequests.length > 0) ? (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">

            {/* Experience Issues */}
            {analysis.experienceIssues && analysis.experienceIssues.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-6 h-6 text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Experience Issues</h2>
                </div>
            <p className="text-gray-600 mb-6">
              UX problems and friction points that users encounter during usage, affecting the overall app experience.
            </p>
            <div className="space-y-3">
              {analysis.experienceIssues.map((issue, index) => (
                <div key={index} className="bg-orange-50/80 rounded-lg p-3 border border-orange-200/60">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{issue.title}</span>

                    {/* Comments Count Button */}
                    {issue.examples && issue.examples.length > 0 && (
                      <button
                        onClick={() => toggleExperienceIssueExpand(index)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {issue.examples.length}
                      </button>
                    )}
                  </div>
                  
                  {/* Comments - Expandable */}
                  {expandedExperienceIssues.has(index) && issue.examples && issue.examples.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {issue.examples.map((example, exIndex) => (
                        <div key={exIndex} className="bg-white p-3 rounded border border-gray-200">
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

            {analysis.featureRequests && analysis.featureRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Feature Requests</h2>
                </div>
            <p className="text-gray-600 mb-6">
              Most requested new features that users want to see, helping your product stay competitive.
            </p>
            <div className="space-y-3">
              {analysis.featureRequests.map((request, index) => (
                <div key={index} className="bg-yellow-50/80 rounded-lg p-3 border border-yellow-200/60">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900">{request.title}</span>

                    {/* Comments Count Button */}
                    {request.examples && request.examples.length > 0 && (
                      <button
                        onClick={() => toggleFeatureRequestExpand(index)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {request.examples.length}
                      </button>
                    )}
                  </div>

                  {/* Comments - Expandable */}
                  {expandedFeatureRequests.has(index) && request.examples && request.examples.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {request.examples.map((example, exIndex) => (
                        <div key={exIndex} className="bg-white p-3 rounded border border-gray-200">
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

          </div>
        ) : null}

        {/* Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Key Insights</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{analysis.insights}</p>
        </div>

        {/* Priority Actions */}
        {analysis.priorityActions && analysis.priorityActions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">Priority Actions</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Based on the analysis results, here are our recommended priority action plans, sorted by importance.
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

