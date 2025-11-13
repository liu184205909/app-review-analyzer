'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Trophy,
  Target,
  Zap,
  Shield,
  Clock,
  Loader2,
  ExternalLink,
  Smartphone
} from 'lucide-react';

// Force dynamic rendering - do not prerender at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ComparisonResult {
  comparisonType: string;
  totalApps: number;
  focusAreas: string[];
  timeRange: string;
  apps: Array<{
    appId: string;
    platform: 'ios' | 'android';
    app: {
      name: string;
      iconUrl?: string;
      rating?: number;
      reviewCount?: number;
      developer?: string;
      category?: string;
    };
    reviewCount: number;
    analyzedCount: number;
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    criticalIssues: Array<{
      title: string;
      frequency: number;
      severity: string;
    }>;
    experienceIssues: Array<{
      title: string;
      frequency: number;
    }>;
    featureRequests: Array<{
      title: string;
      frequency: number;
    }>;
    priorityActions: string[];
    insights: string[];
  }>;
  comparison: {
    sentimentComparison: {
      bestSentiment: any;
      worstSentiment: any;
      ranking: Array<{
        name: string;
        platform: string;
        sentiment: any;
        rating: number;
      }>;
    };
    strengthsComparison: Array<{
      issue: string;
      affectedApps: string[];
      unaffectedApps: string[];
    }>;
    ranking: Array<{
      name: string;
      platform: string;
      overallScore: number;
      sentimentScore: number;
      ratingScore: number;
      issuesCount: number;
      featuresCount: number;
      details: any;
    }>;
    recommendations: Array<{
      type: string;
      target: string;
      recommendation: string;
    }>;
  };
  generatedAt: string;
}

export default function ComparisonResultsPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchComparisonResult();
  }, [taskId]);

  const fetchComparisonResult = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/task/${taskId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch comparison result');
      }

      const data = await response.json();

      if (data.task.status === 'completed') {
        setResult(data.task.result);
      } else if (data.task.status === 'failed') {
        throw new Error(data.task.errorMsg || 'Comparison failed');
      } else {
        // Still processing, check again after delay
        setTimeout(fetchComparisonResult, 2000);
        return;
      }
    } catch (error) {
      console.error('Error fetching comparison result:', error);
      setError(error instanceof Error ? error.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: { positive: number; negative: number; neutral: number }) => {
    const { positive, negative } = sentiment;
    if (positive > negative + 20) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (negative > positive + 20) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getSentimentScore = (sentiment: { positive: number; negative: number; neutral: number }) => {
    const { positive, negative, neutral } = sentiment;
    const total = positive + negative + neutral;
    if (total === 0) return 0;
    return Math.round(((positive - negative) / total) * 100);
  };

  const getRankBadge = (rank: number) => {
    const badges = [
      { icon: '🥇', color: 'bg-yellow-100 text-yellow-800' },
      { icon: '🥈', color: 'bg-gray-100 text-gray-800' },
      { icon: '🥉', color: 'bg-orange-100 text-orange-800' },
    ];
    const badge = badges[rank - 1] || { icon: `#${rank}`, color: 'bg-gray-100 text-gray-800' };
    return badge;
  };

  const exportResults = async () => {
    if (!result) return;

    try {
      setIsExporting(true);

      // Create JSON export
      const exportData = {
        ...result,
        exportedAt: new Date().toISOString(),
        exportedBy: 'App Review Analyzer',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `app-comparison-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Apps...</h2>
          <p className="text-gray-600">This may take a few minutes depending on the number of apps</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Comparison Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => router.push('/compare')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/compare')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Comparison Results</h1>
                <p className="text-sm text-gray-500">
                  {result.totalApps} apps analyzed • Generated {new Date(result.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportResults}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
              </button>
              <Link
                href="/"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rankings Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overall Rankings</h2>
          <div className="grid gap-4">
            {result.comparison.ranking.map((app, index) => {
              const badge = getRankBadge(index + 1);
              return (
                <div key={`${app.name}-${app.platform}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.color} font-bold`}>
                      {badge.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{app.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{app.platform === 'ios' ? 'iOS' : 'Android'}</span>
                        <span>•</span>
                        <span>{app.details?.rating?.toFixed(1) || 'N/A'} ⭐</span>
                        <span>•</span>
                        <span>{app.details?.reviewCount?.toLocaleString() || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {app.overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Score</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Apps Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {result.apps.map((app, index) => {
            const rank = result.comparison.ranking.findIndex(r => r.name === app.app.name) + 1;
            const badge = getRankBadge(rank);

            return (
              <div key={`${app.appId}-${app.platform}`} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {app.app.iconUrl ? (
                      <img
                        src={app.app.iconUrl}
                        alt={app.app.name}
                        className="w-12 h-12 rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.app.name || 'App')}&background=6366f1&color=fff&size=48`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{app.app.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{app.platform === 'ios' ? '🍎 iOS' : '🤖 Android'}</span>
                        <span>•</span>
                        <span>{app.app.rating?.toFixed(1) || 'N/A'} ⭐</span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.color} font-bold`}>
                    {badge.icon}
                  </div>
                </div>

                {/* Sentiment */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Sentiment Score</h3>
                    <div className="flex items-center space-x-1">
                      {getSentimentIcon(app.sentiment)}
                      <span className="font-medium">{getSentimentScore(app.sentiment)}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 w-16">Positive</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${app.sentiment.positive}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8">{app.sentiment.positive}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 w-16">Neutral</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${app.sentiment.neutral}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8">{app.sentiment.neutral}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 w-16">Negative</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${app.sentiment.negative}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-8">{app.sentiment.negative}%</span>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {app.reviewCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {app.criticalIssues.length}
                    </div>
                    <div className="text-xs text-gray-500">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {app.featureRequests.length}
                    </div>
                    <div className="text-xs text-gray-500">Requests</div>
                  </div>
                </div>

                {/* Top Issues */}
                {app.criticalIssues.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Top Issues</h3>
                    <div className="space-y-1">
                      {app.criticalIssues.slice(0, 3).map((issue, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 truncate">{issue.title}</span>
                          <span className="text-gray-500">{issue.frequency} mentions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Details */}
                <Link
                  href={`/analysis/${app.app.name.toLowerCase().replace(/\s+/g, '-')}-${app.platform}`}
                  className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  View Full Analysis
                </Link>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h2>
          <div className="grid gap-4">
            {result.comparison.recommendations.map((rec, index) => {
              const getIcon = (type: string) => {
                switch (type) {
                  case 'improvement': return AlertTriangle;
                  case 'strength': return Trophy;
                  case 'feature': return Zap;
                  default: return Target;
                }
              };
              const Icon = getIcon(rec.type);

              return (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {rec.target === 'All apps' ? 'General Recommendation' : `For ${rec.target}`}
                    </div>
                    <div className="text-gray-600">{rec.recommendation}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sentiment Leader */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🏆 Sentiment Leader</h3>
            <div className="flex items-center space-x-4">
              {result.comparison.sentimentComparison.bestSentiment?.app?.iconUrl ? (
                <img
                  src={result.comparison.sentimentComparison.bestSentiment.app.iconUrl}
                  alt={result.comparison.sentimentComparison.bestSentiment.app.name}
                  className="w-12 h-12 rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {result.comparison.sentimentComparison.bestSentiment.app?.name}
                </div>
                <div className="text-sm text-gray-500">
                  Best user satisfaction with {getSentimentScore(result.comparison.sentimentComparison.bestSentiment.sentiment)}% positive sentiment
                </div>
              </div>
            </div>
          </div>

          {/* Competitive Advantages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Competitive Advantages</h3>
            <div className="space-y-2">
              {result.comparison.strengthsComparison.slice(0, 3).map((strength, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-gray-900">{strength.issue}</div>
                  <div className="text-gray-600">
                    Issues affecting: {strength.affectedApps.join(', ')}
                  </div>
                  <div className="text-green-600">
                    Strength for: {strength.unaffectedApps.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}