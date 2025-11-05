// Home Page - App Review Analyzer MVP
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Clock, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [mode, setMode] = useState<'single' | 'comparison'>('single');
  const [appUrl, setAppUrl] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [focusNegative, setFocusNegative] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'android'>('all');

  // Fetch recent analyses on component mount
  useEffect(() => {
    fetchRecentAnalyses();
  }, [platformFilter]);

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

  const handleAnalyze = async () => {
    setAnalyzing(true);

    try {
      const endpoint = mode === 'single' ? '/api/analyze' : '/api/compare';
      
      const body = mode === 'single' 
        ? {
            appUrl,
            platform,
            options: {
              ratingFilter: focusNegative ? [1, 2, 3] : undefined,
            },
          }
        : {
            yourApp: { appUrl, platform },
            competitors: competitorUrls
              .filter(url => url.trim())
              .map(url => ({ appUrl: url, platform })),
            options: {
              ratingFilter: focusNegative ? [1, 2, 3] : undefined,
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
        // Redirect to results page using slug (SEO-friendly URL)
        const urlPath = data.slug || data.appSlug || data.taskId;
        window.location.href = `/analysis/${urlPath}`;
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to start analysis');
    } finally {
      setAnalyzing(false);
    }
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
          <div className="mb-6">
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
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                最近分析
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
                  全部
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
                  key={analysis.id}
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
                          <span>{analysis.reviewCount} 条评论</span>
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
                          <span>正面 {analysis.sentiment.positive}%</span>
                          <span>负面 {analysis.sentiment.negative}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 text-center">
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-2">✓</div>
            <h3 className="font-semibold mb-2">Dual Platform Support</h3>
            <p className="text-sm text-gray-600">iOS & Android reviews in one place</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-gray-600">Deep insights from Claude & GPT-4</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="font-semibold mb-2">Competitor Comparison</h3>
            <p className="text-sm text-gray-600">SWOT analysis & market opportunities</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-2">🌍</div>
            <h3 className="font-semibold mb-2">Multi-Language Support</h3>
            <p className="text-sm text-gray-600">Analyze reviews in any language</p>
          </div>
        </div>
      </main>
    </div>
  );
}

