'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3
} from 'lucide-react';

// Force dynamic rendering - do not prerender at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AnalysisHistory {
  id: string;
  slug: string;
  platform: 'ios' | 'android';
  appStoreId: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
  app: {
    name: string;
    iconUrl: string;
    rating: number;
    reviewCount: number;
  } | null;
  summary: {
    totalReviews: number;
    analyzedCount: number;
    sentiment: { positive: number; negative: number; neutral: number };
    criticalIssuesCount: number;
    priorityActionsCount: number;
  } | null;
  processing: {
    currentStep: string;
    progress: number;
    estimatedTimeRemaining?: number;
  } | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    sortBy: 'recent',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [filters, pagination?.currentPage]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination?.currentPage?.toString() || '1',
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.platform && { platform: filters.platform }),
        ...(filters.sortBy && { sort: filters.sortBy }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/user/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setAnalyses(data.analyses);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(analysisId);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ analysisId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      // Refresh the list
      await fetchHistory();
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSentimentIcon = (sentiment: { positive: number; negative: number; neutral: number }) => {
    const { positive, negative } = sentiment;
    if (positive > negative + 20) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (negative > positive + 20) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatSentiment = (sentiment: { positive: number; negative: number; neutral: number }) => {
    const { positive, negative, neutral } = sentiment;
    const total = positive + negative + neutral;
    if (total === 0) return '0%';
    const scoreNum = (positive - negative) / total * 100;
    const score = scoreNum.toFixed(1);
    return `${scoreNum > 0 ? '+' : ''}${score}%`;
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading history</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchHistory();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Analysis History
              </h1>
              <span className="text-sm text-gray-500">
                {pagination?.totalItems || 0} analyses
              </span>
            </div>
            <Link
              href="/"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search app names..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="recent">Most Recent</option>
                <option value="app_name">App Name</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={filters.platform}
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Platforms</option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
              </select>

              <button
                onClick={() => setFilters({ status: '', platform: '', sortBy: 'recent', search: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        {analyses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.status || filters.platform
                ? 'Try adjusting your filters or search terms'
                : 'Start analyzing apps to see your history here'}
            </p>
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Analyze Your First App
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Left: App Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* App Icon */}
                    {analysis.app?.iconUrl ? (
                      <img
                        src={analysis.app.iconUrl}
                        alt={analysis.app.name}
                        className="w-12 h-12 rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(analysis.app?.name || 'App')}&background=6366f1&color=fff&size=48`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* App Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link
                          href={`/app/${analysis.slug}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {analysis.app?.name || 'Unknown App'}
                        </Link>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Smartphone className="w-4 h-4" />
                          <span className="capitalize">{analysis.platform}</span>
                        </div>

                        {analysis.app?.rating && (
                          <div className="flex items-center space-x-1">
                            <span>⭐ {analysis.app.rating.toFixed(1)}</span>
                          </div>
                        )}

                        {analysis.app?.reviewCount && (
                          <div className="flex items-center space-x-1">
                            <span>({analysis.app.reviewCount.toLocaleString()} reviews)</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Status & Summary */}
                  <div className="flex items-center space-x-6">
                    {/* Status */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {getStatusIcon(analysis.status)}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(analysis.status)}`}>
                        {analysis.status}
                      </span>
                    </div>

                    {/* Analysis Summary (if completed) */}
                    {analysis.summary && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          {getSentimentIcon(analysis.summary.sentiment)}
                        </div>
                        <div className="text-sm font-medium">
                          {formatSentiment(analysis.summary.sentiment)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {analysis.summary.analyzedCount}/{analysis.summary.totalReviews}
                        </div>
                      </div>
                    )}

                    {/* Processing Info (if processing) */}
                    {analysis.processing && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          {analysis.processing.currentStep}
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${analysis.processing.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2">
                    {analysis.status === 'completed' && (
                      <Link
                        href={`/app/${analysis.slug}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Analysis"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                      disabled={deletingId === analysis.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Analysis"
                    >
                      {deletingId === analysis.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => {
                if (pagination.hasPreviousPage) {
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage - 1,
                  });
                }
              }}
              disabled={!pagination.hasPreviousPage}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, currentPage: page })}
                  className={`px-3 py-1 rounded-md text-sm ${
                    page === pagination.currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (pagination.hasNextPage) {
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage + 1,
                  });
                }
              }}
              disabled={!pagination.hasNextPage}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}