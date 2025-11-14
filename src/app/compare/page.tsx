'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  ArrowRight,
  BarChart3,
  Smartphone,
  Link2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Star,
  Target,
  Zap,
  Shield,
  Globe,
  DollarSign
} from 'lucide-react';

interface ComparisonApp {
  id: string;
  appUrl: string;
  platform: 'ios' | 'android';
  name?: string;
  icon?: string;
  isValid: boolean;
  isLoading: boolean;
  error?: string;
}

interface ComparisonOptions {
  focusAreas: string[];
  timeRange: string;
  exportFormat: string;
}

const focusAreaOptions = [
  { id: 'sentiment', label: 'Sentiment Analysis', icon: TrendingUp, description: 'User emotions and satisfaction' },
  { id: 'features', label: 'Feature Comparison', icon: Zap, description: 'Features and functionality' },
  { id: 'performance', label: 'Performance', icon: Shield, description: 'Speed, stability, and crashes' },
  { id: 'ui_ux', label: 'UI/UX Design', icon: Globe, description: 'User interface and experience' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, description: 'Cost and value perception' },
  { id: 'competitiveness', label: 'Competitive Advantages', icon: Target, description: 'Unique selling points' },
];

const timeRangeOptions = [
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'last_90_days', label: 'Last 90 Days (Recommended)' },
  { id: 'last_6_months', label: 'Last 6 Months' },
  { id: 'all_time', label: 'All Time' },
];

export default function ComparePage() {
  const router = useRouter();
  const [apps, setApps] = useState<ComparisonApp[]>([]);
  const [newAppUrl, setNewAppUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonOptions, setComparisonOptions] = useState<ComparisonOptions>({
    focusAreas: ['sentiment', 'features'],
    timeRange: 'last_90_days',
    exportFormat: 'json',
  });

  const validateAppUrl = (url: string): { platform: 'ios' | 'android' | null; valid: boolean; error?: string } => {
    if (!url.trim()) {
      return { platform: null, valid: false, error: 'Please enter an app URL' };
    }

    // iOS App Store URL pattern
    if (url.includes('apps.apple.com') || url.includes('itunes.apple.com')) {
      if (url.match(/\/id(\d+)/)) {
        return { platform: 'ios', valid: true };
      }
      return { platform: null, valid: false, error: 'Invalid iOS App Store URL format' };
    }

    // Google Play URL pattern
    if (url.includes('play.google.com')) {
      if (url.match(/id=([^&]+)/)) {
        return { platform: 'android', valid: true };
      }
      return { platform: null, valid: false, error: 'Invalid Google Play URL format' };
    }

    return { platform: null, valid: false, error: 'Please enter a valid App Store or Google Play URL' };
  };

  const addApp = async () => {
    if (!newAppUrl.trim()) return;

    const validation = validateAppUrl(newAppUrl);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    // Check for duplicates
    const isDuplicate = apps.some(app => app.appUrl === newAppUrl.trim());
    if (isDuplicate) {
      setError('This app has already been added');
      return;
    }

    if (apps.length >= 5) {
      setError('Maximum 5 apps can be compared at once');
      return;
    }

    const newApp: ComparisonApp = {
      id: Date.now().toString(),
      appUrl: newAppUrl.trim(),
      platform: validation.platform!,
      isValid: false,
      isLoading: true,
    };

    setApps([...apps, newApp]);
    setNewAppUrl('');
    setError(null);

    // Validate the app exists (you could implement an API call here to verify)
    setTimeout(() => {
      setApps(prev => prev.map(app =>
        app.id === newApp.id
          ? { ...app, isValid: true, isLoading: false }
          : app
      ));
    }, 1000);
  };

  const removeApp = (appId: string) => {
    setApps(apps.filter(app => app.id !== appId));
  };

  const toggleFocusArea = (areaId: string) => {
    setComparisonOptions(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter(id => id !== areaId)
        : [...prev.focusAreas, areaId],
    }));
  };

  const startComparison = async () => {
    if (apps.length < 2) {
      setError('Please add at least 2 apps to compare');
      return;
    }

    const invalidApps = apps.filter(app => !app.isValid);
    if (invalidApps.length > 0) {
      setError('Please remove invalid apps before starting comparison');
      return;
    }

    if (comparisonOptions.focusAreas.length === 0) {
      setError('Please select at least one focus area');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?returnUrl=' + encodeURIComponent('/compare'));
        return;
      }

      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          apps: apps.map(app => ({
            appUrl: app.appUrl,
            platform: app.platform,
            options: {
              maxReviews: 500,
              deepAnalysis: true,
            },
          })),
          comparisonOptions: {
            focusAreas: comparisonOptions.focusAreas,
            timeRange: comparisonOptions.timeRange,
            exportFormat: comparisonOptions.exportFormat,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Payment required - usage limit exceeded
          router.push('/pricing?reason=usage_limit');
          return;
        }
        throw new Error(data.error || 'Failed to start comparison');
      }

      // Redirect to comparison results page
      router.push(`/compare/results/${data.taskId}`);

    } catch (error) {
      console.error('Error starting comparison:', error);
      setError(error instanceof Error ? error.message : 'Failed to start comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: 'ios' | 'android') => {
    return platform === 'ios' ? '🍎' : '🤖';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Compare Apps</h1>
                <p className="text-sm text-gray-500">Analyze multiple apps side by side</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* App Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Apps to Compare</h2>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newAppUrl}
                onChange={(e) => setNewAppUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addApp()}
                placeholder="Enter App Store or Google Play URL..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <button
              onClick={addApp}
              disabled={!newAppUrl.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add App
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Apps List */}
          {apps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{apps.length} app{apps.length !== 1 ? 's' : ''} added</span>
                <span>{apps.length >= 2 ? 'Ready to compare' : `Add ${2 - apps.length} more to start`}</span>
              </div>

              <div className="grid gap-3">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      app.isValid ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{getPlatformIcon(app.platform)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {app.isLoading ? 'Validating...' : app.appUrl}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.platform === 'ios' ? 'iOS App Store' : 'Google Play'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                      )}
                      {app.isValid && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {!app.isValid && !app.isLoading && <AlertCircle className="w-4 h-4 text-red-600" />}
                      <button
                        onClick={() => removeApp(app.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comparison Options */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Comparison Options</h2>

          {/* Focus Areas */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Focus Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {focusAreaOptions.map((area) => {
                const Icon = area.icon;
                const isSelected = comparisonOptions.focusAreas.includes(area.id);

                return (
                  <button
                    key={area.id}
                    onClick={() => toggleFocusArea(area.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">{area.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{area.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Time Range</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setComparisonOptions(prev => ({
                    ...prev,
                    timeRange: option.id
                  }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    comparisonOptions.timeRange === option.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Comparison Button */}
        <div className="flex justify-center">
          <button
            onClick={startComparison}
            disabled={apps.length < 2 || isLoading || comparisonOptions.focusAreas.length === 0}
            className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Starting Comparison...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Start Comparison Analysis</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">What to Expect</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Compare up to 5 apps simultaneously</li>
                <li>• Analysis typically takes 5-15 minutes depending on app size</li>
                <li>• You'll receive detailed insights, rankings, and recommendations</li>
                <li>• Results can be exported in various formats for presentations</li>
                <li>• Analysis counts as 1 usage from your monthly quota</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}