// Home Page - App Review Analyzer MVP
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, TrendingUp, Flame } from 'lucide-react';

// Force dynamic rendering - do not prerender at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [mode, setMode] = useState<'single' | 'comparison'>('single');
  const [appUrl, setAppUrl] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [focusNegative, setFocusNegative] = useState(true);
  // const [deepMode, setDeepMode] = useState(true); // Now standard - no need for state
  // Note: Multi-region is now automatically handled by enhanced scraping system
  const [analyzing, setAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'android'>('all');
  const [popularAnalyses, setPopularAnalyses] = useState<any[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [popularPlatformFilter, setPopularPlatformFilter] = useState<'all' | 'ios' | 'android'>('all');

  // Fetch recent analyses on component mount
  useEffect(() => {
    fetchRecentAnalyses();
  }, [platformFilter]);

  // Fetch popular analyses on component mount
  useEffect(() => {
    fetchPopularAnalyses();
  }, [popularPlatformFilter]);

  const fetchRecentAnalyses = async () => {
    try {
      const platformParam = platformFilter === 'all' ? '' : `&platform=${platformFilter}`;
      const response = await fetch(`/api/recent?limit=12&sort=recent${platformParam}`);
      const data = await response.json();
      setRecentAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to fetch recent analyses:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchPopularAnalyses = async () => {
    try {
      const platformParam = popularPlatformFilter === 'all' ? '' : `&platform=${popularPlatformFilter}`;
      const response = await fetch(`/api/popular?limit=12${platformParam}`);
      const data = await response.json();
      setPopularAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to fetch popular analyses:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setShowProgressModal(true);
    setAnalysisProgress(0);
    setAnalysisStatus('Initializing analysis...');

    try {
      const endpoint = mode === 'single' ? '/api/analyze' : '/api/compare';

      const body = mode === 'single'
        ? {
            appUrl,
            platform,
            options: {
              ratingFilter: focusNegative ? [1, 2, 3] : undefined,
              deepMode: true, // Standard feature - always enabled
              // Multi-region is now automatically handled by enhanced scraping system
            },
          }
        : {
            yourApp: { appUrl, platform },
            competitors: competitorUrls
              .filter(url => url.trim())
              .map(url => ({ appUrl: url, platform })),
            options: {
              ratingFilter: focusNegative ? [1, 2, 3] : undefined,
              deepMode: true, // Standard feature - always enabled
              // Multi-region is now automatically handled by enhanced scraping system
            },
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setTaskId(data.taskId);
        // Start real-time progress tracking
        trackProgress(data.taskId);
      } else {
        // Enhanced error handling with suggestions
        const errorMessage = data.error || 'Unknown error occurred';
        const errorDetails = data.details;

        if (errorDetails && errorDetails.suggestions) {
          const suggestions = errorDetails.suggestions.join('\n• ');
          alert(`❌ ${errorMessage}\n\nSuggestions:\n• ${suggestions}`);
        } else {
          alert(`❌ ${errorMessage}`);
        }
        setShowProgressModal(false);
        setAnalyzing(false);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to start analysis');
      setShowProgressModal(false);
      setAnalyzing(false);
    }
  };

  const trackProgress = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analyze?taskId=${taskId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          setAnalysisProgress(100);
          setAnalysisStatus('Analysis complete! Redirecting...');
          setTimeout(() => {
            const urlPath = data.slug || data.appSlug || data.taskId;
            window.location.href = `/analysis/${urlPath}`;
          }, 1500);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          alert('Analysis failed. Please try again.');
          setShowProgressModal(false);
          setAnalyzing(false);
        } else if (data.progress !== undefined) {
          setAnalysisProgress(data.progress);
          setAnalysisStatus(getStatusMessage(data.progress));
        }
      } catch (error) {
        console.error('Progress tracking error:', error);
        clearInterval(pollInterval);
        setShowProgressModal(false);
        setAnalyzing(false);
      }
    }, 1500); // Poll every 1.5 seconds for smooth updates
  };

  const getStatusMessage = (progress: number): string => {
    if (progress < 5) return 'Initializing analysis...';
    if (progress < 15) return 'Setting up database...';
    if (progress < 45) return 'Fetching reviews from stores...';
    if (progress < 60) return 'Processing and saving reviews...';
    if (progress < 70) return 'Selecting best reviews for analysis...';
    if (progress < 85) return 'Analyzing with AI...';
    if (progress < 95) return 'Generating insights and recommendations...';
    return 'Finalizing report...';
  };

  const addCompetitor = () => {
    if (competitorUrls.length < 4) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ReviewInsight</h1>
          <nav className="flex gap-6 text-sm">
            <a href="/compare" className="text-indigo-600 hover:text-indigo-700 font-medium">Compare Apps</a>
            <a href="/browse" className="text-gray-600 hover:text-gray-900 font-medium">Browse Apps</a>
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <button className="text-gray-600 hover:text-gray-900">Sign In</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Analyze App Reviews &<br />Uncover User Needs
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Discover opportunities from competitor reviews in minutes
          </p>
          <p className="text-sm text-gray-500">
            Powered by AI • Supports iOS & Android
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Platform
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  platform === 'ios'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                🍎 iOS App Store
              </button>
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  platform === 'android'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                🤖 Google Play
              </button>
            </div>
          </div>

          {/* Analysis Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Analysis Mode
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${
                  mode === 'single'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                📱 Single App
              </button>
              <button
                onClick={() => setMode('comparison')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition relative ${
                  mode === 'comparison'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚔️ Compare Apps
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                  Pro
                </span>
              </button>
            </div>
          </div>

          {/* App URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'single' ? 'App Store URL' : 'Your App URL'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              📎 Paste the complete App Store or Google Play URL
            </p>
            <div className="relative">
              <input
                type="text"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder={
                  platform === 'ios'
                    ? 'https://apps.apple.com/us/app/instagram/id389801252'
                    : 'https://play.google.com/store/apps/details?id=com.instagram.android'
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Competitor URLs (Comparison Mode) */}
          {mode === 'comparison' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competitor Apps (up to 4)
              </label>
              {competitorUrls.map((url, index) => (
                <div key={index} className="relative mb-3">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateCompetitor(index, e.target.value)}
                    placeholder={`Competitor ${index + 1} URL`}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {competitorUrls.length > 1 && (
                    <button
                      onClick={() => removeCompetitor(index)}
                      className="absolute right-4 top-3.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {competitorUrls.length < 4 && (
                <button
                  onClick={addCompetitor}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Competitor
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={focusNegative}
                onChange={(e) => setFocusNegative(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                🔥 Focus on negative reviews (1-3⭐) - Recommended
              </span>
            </label>

            {/* Note: Multi-region scraping is now automatically handled by enhanced scraping system */}

          {/* Review Count Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Enhanced Review Analysis (Auto Multi-Region):
              </span>
              <span className="text-sm font-bold text-purple-700">
                1500-2000+ reviews
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ⏱️ Estimated time: 3-5 minutes
            </p>
            <p className="text-xs text-gray-500 mt-2">
              📊 50% critical issues, 30% experience, 20% positive reviews
            </p>
            <p className="text-xs text-gray-400 mt-1">
              🌍 Automatically collects reviews from US, UK, CA, AU, DE, FR, JP, KR
            </p>
          </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !appUrl}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              `Start Analysis ${mode === 'comparison' ? '→' : '🔍'}`
            )}
          </button>
        </div>

        {/* Recent Analyses */}
        {!loadingRecent && recentAnalyses.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Latest Analysis
              </h2>
              
              {/* Platform Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    platformFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  All Apps
                </button>
                <button
                  onClick={() => setPlatformFilter('ios')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    platformFilter === 'ios'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  iOS
                </button>
                <button
                  onClick={() => setPlatformFilter('android')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    platformFilter === 'android'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Android
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAnalyses.map((analysis) => (
                <a
                  key={`${analysis.slug}-${analysis.platform}`}
                  href={`/analysis/${analysis.slug}`}
                  className="group block p-5 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-start gap-4">
                    {/* App Icon */}
                    {analysis.iconUrl ? (
                      <img
                        src={analysis.iconUrl}
                        alt={analysis.appName}
                        className="w-14 h-14 rounded-xl flex-shrink-0 group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Search className="w-7 h-7 text-white" />
                      </div>
                    )}

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition">
                        {analysis.appName}
                      </h3>
                      
                      {/* Rating & Platform */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm font-medium text-gray-700">
                            {analysis.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-300">·</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          analysis.platform === 'ios' 
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {analysis.platform === 'ios' ? 'iOS' : 'Android'}
                        </span>
                      </div>

                      {/* Sentiment Bar */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <span>{analysis.reviewCount} reviews</span>
                        </div>
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-100">
                          <div 
                            className="bg-green-500"
                            style={{ width: `${analysis.sentiment.positive}%` }}
                          />
                          <div 
                            className="bg-yellow-400"
                            style={{ width: `${analysis.sentiment.neutral}%` }}
                          />
                          <div 
                            className="bg-red-500"
                            style={{ width: `${analysis.sentiment.negative}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Positive {analysis.sentiment.positive}%</span>
                          <span>Negative {analysis.sentiment.negative}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Popular Analyses */}
        {!loadingPopular && popularAnalyses.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-500" />
                Popular Analysis
              </h2>
              
              {/* Platform Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPopularPlatformFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    popularPlatformFilter === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  All Apps
                </button>
                <button
                  onClick={() => setPopularPlatformFilter('ios')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    popularPlatformFilter === 'ios'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  iOS
                </button>
                <button
                  onClick={() => setPopularPlatformFilter('android')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    popularPlatformFilter === 'android'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Android
                </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularAnalyses.map((analysis) => (
                <a
                  key={`${analysis.slug}-${analysis.platform}`}
                  href={`/analysis/${analysis.slug}`}
                  className="group block p-5 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-orange-200"
                >
                  <div className="flex items-start gap-4">
                    {/* App Icon */}
                    {analysis.iconUrl ? (
                      <img
                        src={analysis.iconUrl}
                        alt={analysis.appName}
                        className="w-14 h-14 rounded-xl flex-shrink-0 group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Flame className="w-7 h-7 text-white" />
                      </div>
                    )}

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-orange-600 transition">
                        {analysis.appName}
                      </h3>
                      
                      {/* Rating & Platform */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm font-medium text-gray-700">
                            {analysis.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-gray-300">·</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          analysis.platform === 'ios' 
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {analysis.platform === 'ios' ? 'iOS' : 'Android'}
                        </span>
                      </div>

                      {/* Total Reviews Badge */}
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                          {analysis.appReviewCount?.toLocaleString() || '0'} total reviews
                        </span>
                      </div>

                      {/* Sentiment Bar */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                          <span>{analysis.reviewCount} analyzed</span>
                        </div>
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-gray-100">
                          <div 
                            className="bg-green-500"
                            style={{ width: `${analysis.sentiment.positive}%` }}
                          />
                          <div 
                            className="bg-yellow-400"
                            style={{ width: `${analysis.sentiment.neutral}%` }}
                          />
                          <div 
                            className="bg-red-500"
                            style={{ width: `${analysis.sentiment.negative}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Positive {analysis.sentiment.positive}%</span>
                          <span>Negative {analysis.sentiment.negative}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Use Cases Section */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Uses ReviewInsight?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trusted by product teams, developers, and marketers worldwide
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="text-4xl mb-4">👨‍💻</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Product Teams</h3>
              <p className="text-sm text-gray-600">
                Discover user pain points and feature requests to prioritize your roadmap and improve product-market fit
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">App Developers</h3>
              <p className="text-sm text-gray-600">
                Identify bugs and crashes mentioned in reviews to fix issues faster and boost app ratings
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Marketers & Analysts</h3>
              <p className="text-sm text-gray-600">
                Analyze competitor apps and understand market sentiment to refine your positioning strategy
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ReviewInsight?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Leverage AI-powered analysis to understand your users better and make data-driven decisions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-600">
                Deep insights from Claude & GPT-4 to identify critical issues and opportunities
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                Get comprehensive analysis in under 10 seconds, not hours
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Actionable Insights</h3>
              <p className="text-sm text-gray-600">
                Prioritized recommendations to improve your app and boost ratings
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-Platform</h3>
              <p className="text-sm text-gray-600">
                Analyze both iOS App Store and Google Play Store reviews in one place
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get actionable insights from app reviews in just 3 simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enter App URL</h3>
              <p className="text-gray-600">
                Paste the App Store or Google Play URL of the app you want to analyze
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes hundreds of reviews to identify key issues and patterns
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Insights</h3>
              <p className="text-gray-600">
                Receive detailed report with prioritized actions to improve your app
              </p>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="mt-24 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What You Get in Every Report</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive analysis delivered in a beautiful, easy-to-understand format
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Critical Issues</h3>
                <p className="text-sm text-gray-600">
                  Most urgent problems affecting user experience, with real review examples
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📉</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Experience Issues</h3>
                <p className="text-sm text-gray-600">
                  UX problems and friction points that frustrate your users
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Feature Requests</h3>
                <p className="text-sm text-gray-600">
                  Most requested features to help you prioritize your product roadmap
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Action Plan</h3>
                <p className="text-sm text-gray-600">
                  Prioritized recommendations to improve ratings and user satisfaction
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Sentiment Analysis</h3>
                <p className="text-sm text-gray-600">
                  Overall sentiment breakdown and emotional tone of user feedback
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Real Review Examples</h3>
                <p className="text-sm text-gray-600">
                  Actual user quotes to understand the voice of your customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 mb-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Understand Your Users?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get AI-powered insights from app reviews in seconds
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Analyze Your App Now
          </button>
        </div>
      </main>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            {/* Spinner with percentage */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <svg className="animate-spin h-16 w-16 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{analysisProgress}%</span>
                </div>
              </div>
            </div>

            {/* Title and status */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Analyzing Reviews
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {analysisStatus}
            </p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>

            {/* Stage indicators */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className={`text-center p-2 rounded-lg text-xs ${
                analysisProgress >= 45 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className="font-medium">📥 Fetch</div>
                <div className="text-xs opacity-75">Reviews</div>
              </div>
              <div className={`text-center p-2 rounded-lg text-xs ${
                analysisProgress >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className="font-medium">⚙️ Process</div>
                <div className="text-xs opacity-75">Data</div>
              </div>
              <div className={`text-center p-2 rounded-lg text-xs ${
                analysisProgress >= 85 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className="font-medium">🤖 AI</div>
                <div className="text-xs opacity-75">Analysis</div>
              </div>
              <div className={`text-center p-2 rounded-lg text-xs ${
                analysisProgress >= 95 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className="font-medium">📊 Report</div>
                <div className="text-xs opacity-75">Ready</div>
              </div>
            </div>

            {/* Estimated time */}
            <p className="text-sm text-center text-gray-500">
              {analysisProgress < 15 ? 'Estimated time: 2-3 minutes' :
               analysisProgress < 45 ? 'Estimated time: 1-2 minutes' :
               analysisProgress < 70 ? 'Estimated time: 45-60 seconds' :
               analysisProgress < 85 ? 'Estimated time: 20-30 seconds' :
               analysisProgress < 100 ? 'Almost done...' : 'Analysis complete!'}
            </p>

            {/* Cancel button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setAnalyzing(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Cancel and return to homepage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

