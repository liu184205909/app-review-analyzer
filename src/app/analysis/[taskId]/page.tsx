// Analysis Result Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, TrendingDown, Lightbulb, Target, Download } from 'lucide-react';
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

  if (loading || !data || data.status === 'processing' || data.status === 'pending') {
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
        {/* App Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex items-center gap-4">
          <img 
            src={app.iconUrl} 
            alt={app.name}
            className="w-20 h-20 rounded-xl"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{app.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>⭐ {app.rating.toFixed(1)}</span>
              <span>{app.reviewCount.toLocaleString()} reviews</span>
              <span className="text-blue-600">Analyzed {analyzedCount} negative reviews</span>
            </div>
          </div>
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

        {/* Critical Issues */}
        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Critical Issues</h2>
            </div>
            <div className="space-y-4">
              {analysis.criticalIssues.map((issue, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                    <span className="text-sm text-gray-500">
                      {issue.frequency} mentions
                    </span>
                  </div>
                  {issue.examples && issue.examples.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 italic">
                      "{issue.examples[0]}"
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
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold">Experience Issues</h2>
            </div>
            <div className="space-y-3">
              {analysis.experienceIssues.map((issue, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-gray-700">{issue.title}</span>
                  <span className="text-sm text-gray-500">{issue.frequency} mentions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Requests */}
        {analysis.featureRequests && analysis.featureRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Feature Requests</h2>
            </div>
            <div className="space-y-3">
              {analysis.featureRequests.map((request, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-gray-700">{request.title}</span>
                  <span className="text-sm text-gray-500">{request.frequency} mentions</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">📊 Key Insights</h2>
          <p className="text-gray-700 leading-relaxed">{analysis.insights}</p>
        </div>

        {/* Priority Actions */}
        {analysis.priorityActions && analysis.priorityActions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold">Recommended Actions</h2>
            </div>
            <ol className="space-y-2">
              {analysis.priorityActions.map((action, index) => (
                <li key={index} className="flex gap-3">
                  <span className="font-semibold text-gray-400">#{index + 1}</span>
                  <span className="text-gray-700">{action}</span>
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

