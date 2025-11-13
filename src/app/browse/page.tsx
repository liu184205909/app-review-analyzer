// Browse Apps Page - Category and Region Filters
'use client';

// Prevent Next.js from trying to collect page data
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState, useEffect } from 'react';
import { Search, Filter, Globe, Grid, List } from 'lucide-react';
import { POPULAR_CATEGORIES, normalizeCategory } from '@/lib/category';

interface AppItem {
  id: string;
  slug: string;
  platform: 'ios' | 'android';
  appName: string;
  iconUrl: string;
  rating: number;
  category: string;
  appReviewCount: number;
  reviewCount: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function BrowsePage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('United States');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'ios' | 'android'>('all');
  
  // Popular categories (using unified categories)
  const popularCategories = ['All', ...POPULAR_CATEGORIES];

  // Popular regions
  const popularRegions = [
    'United States',
    'China',
    'Japan',
    'South Korea',
    'United Kingdom',
    'Germany',
    'France',
    'India',
    'Brazil',
    'Canada',
  ];

  useEffect(() => {
    fetchApps();
  }, [selectedCategory, selectedRegion, selectedPlatform]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory === 'All' ? '' : `&category=${encodeURIComponent(selectedCategory)}`;
      const platformParam = selectedPlatform === 'all' ? '' : `&platform=${selectedPlatform}`;
      // Note: Region filtering by review country would require additional API work
      const response = await fetch(`/api/browse?limit=24${categoryParam}${platformParam}`);
      const data = await response.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900">ReviewInsight</a>
          <nav className="flex gap-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="/browse" className="text-blue-600 font-medium">Browse Apps</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Apps</h1>
          <p className="text-gray-600">
            Discover apps by category and region. View detailed analysis reports.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Popular Categories */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Popular Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Regions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Popular Regions
            </label>
            <div className="flex flex-wrap gap-2">
              {popularRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Platform</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPlatform === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Platforms
              </button>
              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPlatform === 'ios'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                iOS
              </button>
              <button
                onClick={() => setSelectedPlatform('android')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPlatform === 'android'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Android
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedCategory === 'All' ? 'All Apps' : `${selectedCategory}`}
            {selectedPlatform !== 'all' && ` (${selectedPlatform === 'ios' ? 'iOS' : 'Android'})`}
          </h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${apps.length} apps`}
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading apps...</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No apps found. Try different filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <a
                key={`${app.slug}-${app.platform}`}
                href={`/analysis/${app.slug}`}
                className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  {/* App Icon */}
                  {app.iconUrl ? (
                    <img
                      src={app.iconUrl}
                      alt={app.appName}
                      className="w-16 h-16 rounded-xl flex-shrink-0 group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Grid className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* App Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
                      {app.appName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        app.platform === 'ios' 
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {app.platform === 'ios' ? 'iOS' : 'Android'}
                      </span>
                      <span className="text-xs text-gray-500">{app.category}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-medium text-gray-700">
                        {app.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">
                        {app.appReviewCount.toLocaleString()} reviews
                      </span>
                    </div>
                    {/* Sentiment Bar */}
                    <div className="mt-2">
                      <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-gray-100">
                        <div 
                          className="bg-green-500"
                          style={{ width: `${app.sentiment.positive}%` }}
                        />
                        <div 
                          className="bg-yellow-400"
                          style={{ width: `${app.sentiment.neutral}%` }}
                        />
                        <div 
                          className="bg-red-500"
                          style={{ width: `${app.sentiment.negative}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

