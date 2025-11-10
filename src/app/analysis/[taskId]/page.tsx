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

  // Professional role state
  const [selectedRole, setSelectedRole] = useState<'product-manager' | 'developer' | 'ux-designer' | 'general'>('general');

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

    
        {/* Critical Issues with Enhanced Card Design */}
        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
          <div className="bg-gradient-to-br from-white via-red-50/20 to-white rounded-xl shadow-lg p-6 mb-6 border border-red-100">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-400 rounded-lg shadow-sm">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Critical Issues</h2>
                  <p className="text-sm text-red-500 font-medium">
                    {analysis.criticalIssues.length} critical problems • {analysis.criticalIssues.reduce((sum, issue) => sum + (issue.frequency || 0), 0)} mentions
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allExpanded = expandedIssues.size === analysis.criticalIssues.length;
                    if (allExpanded) {
                      setExpandedIssues(new Set());
                    } else {
                      setExpandedIssues(new Set(analysis.criticalIssues.map((_, index) => index)));
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  {expandedIssues.size === analysis.criticalIssues.length ? 'Collapse All' : 'Expand All'}
                </button>
                <select
                  className="px-4 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => {
                    const sorted = [...analysis.criticalIssues].sort((a, b) => {
                      if (e.target.value === 'frequency') return (b.frequency || 0) - (a.frequency || 0);
                      if (e.target.value === 'alphabetical') return a.title.localeCompare(b.title);
                      return 0;
                    });
                    // Update order logic here
                  }}
                >
                  <option value="frequency">Sort by Frequency</option>
                  <option value="alphabetical">Sort by Name</option>
                </select>
              </div>
            </div>

            {/* Enhanced Cards */}
            <div className="grid gap-4">
              {analysis.criticalIssues.map((issue, index) => {
                const maxFrequency = Math.max(...analysis.criticalIssues.map(i => i.frequency || 0));
                const frequencyRatio = (issue.frequency || 0) / maxFrequency;

                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border-2 border-red-100 bg-white hover:border-red-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => toggleIssueExpand(index)}
                  >
                    {/* Frequency Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-300 to-red-400 transition-all duration-500"
                         style={{ width: `${frequencyRatio * 100}%` }} />

                    {/* Card Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              issue.severity === 'high' ? 'bg-red-400 text-white' :
                              issue.severity === 'medium' ? 'bg-orange-300 text-white' :
                              'bg-yellow-300 text-white'
                            }`}>
                              {issue.severity?.toUpperCase() || 'HIGH'}
                            </div>
                            <div className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                              Frequency: {issue.frequency}
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-red-500 transition-colors">
                            {issue.title}
                          </h3>
                        </div>

                        {/* Expand/Collapse Icon with Count */}
                        <div className="relative group">
                          {issue.examples && issue.examples.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium shadow-sm group-hover:bg-red-200 transition-all cursor-pointer">
                              <MessageSquare className="w-3 h-3" />
                              <span>{issue.examples.length}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Comments */}
                      {expandedIssues.has(index) && issue.examples && issue.examples.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>User Examples ({issue.examples.length})</span>
                          </div>
                          {issue.examples.map((example, exIndex) => (
                            <div key={exIndex} className="bg-red-50/50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                💬 "{example}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Experience Issues & Feature Requests - Two Column Layout */}
        {(analysis.experienceIssues && analysis.experienceIssues.length > 0) ||
         (analysis.featureRequests && analysis.featureRequests.length > 0) ? (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">

            {/* Experience Issues with Enhanced Card Design */}
            {analysis.experienceIssues && analysis.experienceIssues.length > 0 && (
              <div className="bg-gradient-to-br from-white via-orange-50/20 to-white rounded-xl shadow-lg p-6 mb-6 border border-orange-100">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-400 rounded-lg shadow-sm">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Experience Issues</h2>
                      <p className="text-sm text-orange-500 font-medium">
                        {analysis.experienceIssues.length} experience problems • {analysis.experienceIssues.reduce((sum, issue) => sum + (issue.frequency || 0), 0)} mentions
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const allExpanded = expandedExperienceIssues.size === analysis.experienceIssues.length;
                        if (allExpanded) {
                          setExpandedExperienceIssues(new Set());
                        } else {
                          setExpandedExperienceIssues(new Set(analysis.experienceIssues.map((_, index) => index)));
                        }
                      }}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                    >
                      {expandedExperienceIssues.size === analysis.experienceIssues.length ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>
                </div>

                {/* Enhanced Cards */}
                <div className="grid gap-4">
                  {analysis.experienceIssues.map((issue, index) => {
                    const maxFrequency = Math.max(...analysis.experienceIssues.map(i => i.frequency || 0));
                    const frequencyRatio = (issue.frequency || 0) / maxFrequency;

                    return (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border-2 border-orange-100 bg-white hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => toggleExperienceIssueExpand(index)}
                      >
                        {/* Frequency Bar */}
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-orange-300 to-orange-400 transition-all duration-500"
                             style={{ width: `${frequencyRatio * 100}%` }} />

                        {/* Card Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="px-2 py-1 bg-orange-300 text-white rounded-full text-xs font-medium">
                                  UX
                                </div>
                                <div className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                                  Frequency: {issue.frequency}
                                </div>
                              </div>
                              <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-orange-500 transition-colors">
                                {issue.title}
                              </h3>
                            </div>

                            {/* Expand/Collapse Icon with Count */}
                            <div className="relative group">
                              {issue.examples && issue.examples.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium shadow-sm group-hover:bg-orange-200 transition-all cursor-pointer">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{issue.examples.length}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expandable Comments */}
                          {expandedExperienceIssues.has(index) && issue.examples && issue.examples.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>User Examples ({issue.examples.length})</span>
                              </div>
                              {issue.examples.map((example, exIndex) => (
                                <div key={exIndex} className="bg-orange-50/50 border border-orange-200 rounded-lg p-3">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    💬 "{example}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feature Requests with Enhanced Card Design */}
            {analysis.featureRequests && analysis.featureRequests.length > 0 && (
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-xl shadow-lg p-6 mb-6 border border-blue-100">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Feature Requests</h2>
                      <p className="text-sm text-blue-600 font-medium">
                        {analysis.featureRequests.length} feature requests • {analysis.featureRequests.reduce((sum, request) => sum + (request.frequency || 0), 0)} mentions
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const allExpanded = expandedFeatureRequests.size === analysis.featureRequests.length;
                        if (allExpanded) {
                          setExpandedFeatureRequests(new Set());
                        } else {
                          setExpandedFeatureRequests(new Set(analysis.featureRequests.map((_, index) => index)));
                        }
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      {expandedFeatureRequests.size === analysis.featureRequests.length ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>
                </div>

                {/* Enhanced Cards */}
                <div className="grid gap-4">
                  {analysis.featureRequests.map((request, index) => {
                    const maxFrequency = Math.max(...analysis.featureRequests.map(r => r.frequency || 0));
                    const frequencyRatio = (request.frequency || 0) / maxFrequency;

                    return (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border-2 border-blue-100 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        onClick={() => toggleFeatureRequestExpand(index)}
                      >
                        {/* Frequency Bar */}
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                             style={{ width: `${frequencyRatio * 100}%` }} />

                        {/* Card Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                                  REQUEST
                                </div>
                                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Frequency: {request.frequency}
                                </div>
                                {/* Status Badge */}
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  request.frequency > 10 ? 'bg-green-100 text-green-700' :
                                  request.frequency > 5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {request.frequency > 10 ? 'IMPLEMENTED' :
                                   request.frequency > 5 ? 'PLANNED' : 'CONSIDERING'}
                                </div>
                              </div>
                              <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                {request.title}
                              </h3>
                            </div>

                            {/* Expand/Collapse Icon with Count */}
                            <div className="relative group">
                              {request.examples && request.examples.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium shadow-sm group-hover:bg-blue-200 transition-all cursor-pointer">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{request.examples.length}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expandable Comments */}
                          {expandedFeatureRequests.has(index) && request.examples && request.examples.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>User Examples ({request.examples.length})</span>
                              </div>
                              {request.examples.map((example, exIndex) => (
                                <div key={exIndex} className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    💡 "{example}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : null}

        {/* Customer Value Metrics with Role Switcher */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">💰 Customer Value Analysis</h2>

            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setSelectedRole('general')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedRole === 'general'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 总览
              </button>
              <button
                onClick={() => setSelectedRole('product-manager')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedRole === 'product-manager'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 产品经理
              </button>
              <button
                onClick={() => setSelectedRole('developer')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedRole === 'developer'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👨‍💻 开发者
              </button>
              <button
                onClick={() => setSelectedRole('ux-designer')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedRole === 'ux-designer'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🎨 UX设计师
              </button>
            </div>
          </div>
          {/* Role-specific Metrics */}
          {selectedRole === 'general' && (
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {((analysis.sentiment.positive / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">Customer Satisfaction</div>
                <div className="text-xs text-gray-500 mt-1">Likely to recommend app</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {analysis.criticalIssues.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Risk Factors</div>
                <div className="text-xs text-gray-500 mt-1">Issues causing churn risk</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {analysis.featureRequests.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Growth Opportunities</div>
                <div className="text-xs text-gray-500 mt-1">Features users want most</div>
              </div>
            </div>
          )}

          {selectedRole === 'product-manager' && (
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {Math.round(analysis.featureRequests.reduce((sum, req) => sum + (req.frequency || 0), 0) * 0.15)}
                </div>
                <div className="text-sm text-gray-600 font-medium">潜在收入增长</div>
                <div className="text-xs text-gray-500 mt-1">基于功能需求预测</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  ${Math.round(analysis.criticalIssues.reduce((sum, issue) => sum + (issue.frequency || 0), 0) * 250)}
                </div>
                <div className="text-sm text-gray-600 font-medium">收入损失风险</div>
                <div className="text-xs text-gray-500 mt-1">用户流失成本估算</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.round((analysis.featureRequests.length / (analysis.featureRequests.length + analysis.criticalIssues.length)) * 100)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">产品健康度</div>
                <div className="text-xs text-gray-500 mt-1">需求vs问题平衡</div>
              </div>
            </div>
          )}

          {selectedRole === 'developer' && (
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {analysis.criticalIssues.filter(issue => issue.severity === 'high').length}
                </div>
                <div className="text-sm text-gray-600 font-medium">紧急技术债务</div>
                <div className="text-xs text-gray-500 mt-1">需立即修复的高优先级问题</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {analysis.criticalIssues.filter(issue =>
                    issue.title.toLowerCase().includes('crash') ||
                    issue.title.toLowerCase().includes('performance') ||
                    issue.title.toLowerCase().includes('freeze')
                  ).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">性能相关问题</div>
                <div className="text-xs text-gray-500 mt-1">影响用户体验的核心问题</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.round((analysis.criticalIssues.length / 5) * 2)}周
                </div>
                <div className="text-sm text-gray-600 font-medium">预计修复时间</div>
                <div className="text-xs text-gray-500 mt-1">基于复杂度估算</div>
              </div>
            </div>
          )}

          {selectedRole === 'ux-designer' && (
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {((analysis.sentiment.positive / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">用户体验满意度</div>
                <div className="text-xs text-gray-500 mt-1">界面和交互评分</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {analysis.experienceIssues.filter(issue =>
                    issue.title.toLowerCase().includes('ui') ||
                    issue.title.toLowerCase().includes('interface') ||
                    issue.title.toLowerCase().includes('design')
                  ).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">界面设计问题</div>
                <div className="text-xs text-gray-500 mt-1">需优化的UI元素</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {analysis.experienceIssues.filter(issue =>
                    issue.title.toLowerCase().includes('navigation') ||
                    issue.title.toLowerCase().includes('menu') ||
                    issue.title.toLowerCase().includes('flow')
                  ).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">交互流程问题</div>
                <div className="text-xs text-gray-500 mt-1">用户体验路径优化</div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-2">Business Impact Assessment</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Based on {analyzedCount} reviews analyzed, addressing the critical issues could improve user retention by up to {Math.min(40, analysis.criticalIssues.length * 8)}%.
              The feature requests represent potential revenue growth opportunities from {Math.round((analysis.sentiment.positive / (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral)) * 100)}% of satisfied users who want enhanced functionality.
            </p>
          </div>
        </div>

        {/* User Journey Insights */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6 border border-teal-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🗺️ User Journey Analysis</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Onboarding</h4>
              </div>
              <p className="text-xs text-gray-600">
                {analysis.sentiment.positive > analysis.sentiment.negative ? 'Strong first impressions' : 'Needs improvement'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Daily Use</h4>
              </div>
              <p className="text-xs text-gray-600">
                {analysis.experienceIssues.length > 5 ? 'Friction detected' : 'Smooth experience'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">🎯</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Core Value</h4>
              </div>
              <p className="text-xs text-gray-600">
                {analysis.featureRequests.length > 8 ? 'High engagement potential' : 'Clear value proposition'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Retention Risk</h4>
              </div>
              <p className="text-xs text-gray-600">
                {analysis.criticalIssues.length > 3 ? 'Multiple churn risks' : 'Low risk indicators'}
              </p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Key Insights</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{analysis.insights}</p>
        </div>

        {/* Competitive Positioning */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 mb-6 border border-amber-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Competitive Positioning</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                Competitive Advantages
              </h3>
              <ul className="space-y-2">
                {analysis.sentiment.positive > 60 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>High user satisfaction ({Math.round(analysis.sentiment.positive)}% positive)</span>
                  </li>
                )}
                {analysis.criticalIssues.length < 5 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Stable performance with minimal critical issues</span>
                  </li>
                )}
                {analysis.featureRequests.length > 8 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Strong user engagement and feature demand</span>
                  </li>
                )}
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Comprehensive review data ({analyzedCount} reviews analyzed)</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">!</span>
                Market Opportunities
              </h3>
              <ul className="space-y-2">
                {analysis.experienceIssues.length > 8 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>UX improvements could significantly boost retention</span>
                  </li>
                )}
                {analysis.featureRequests.length > 6 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>High-demand features present revenue opportunities</span>
                  </li>
                )}
                {analysis.sentiment.negative > 20 && (
                  <li className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Addressing complaints could improve market position</span>
                  </li>
                )}
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Data-driven insights guide product strategy</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Market Score</h4>
              <span className="text-2xl font-bold text-amber-600">
                {Math.round(((analysis.sentiment.positive * 0.4) +
                  ((10 - analysis.criticalIssues.length) * 4) +
                  (analysis.featureRequests.length * 3) +
                  (analyzedCount > 200 ? 10 : analyzedCount / 20)) / 100 * 100)}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round(((analysis.sentiment.positive * 0.4) +
                  ((10 - analysis.criticalIssues.length) * 4) +
                  (analysis.featureRequests.length * 3) +
                  (analyzedCount > 200 ? 10 : analyzedCount / 20)) / 100 * 100))}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">Based on user satisfaction, stability, feature demand, and data quality</p>
          </div>
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

