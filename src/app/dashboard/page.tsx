'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  BarChart3,
  TrendingUp,
  CreditCard,
  LogOut,
  Settings,
  Crown,
  Users,
  Zap
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'professional' | 'team';
  monthlyAnalysisCount: number;
  activeSubscription: any;
  createdAt: string;
}

interface AnalysisStats {
  totalAnalyses: number;
  thisMonthAnalyses: number;
  averageReviewCount: number;
  mostAnalyzedPlatform: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // 获取用户信息
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      setUser(userData.user);

      // 获取分析统计（模拟数据，实际应该从API获取）
      const mockStats: AnalysisStats = {
        totalAnalyses: 12,
        thisMonthAnalyses: userData.user.monthlyAnalysisCount,
        averageReviewCount: 1250,
        mostAnalyzedPlatform: 'iOS',
      };
      setStats(mockStats);

    } catch (error) {
      console.error('Error fetching user data:', error);
      // 如果token无效，重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/subscription/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create management session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;

    } catch (error) {
      console.error('Error managing subscription:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/subscription/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ immediate: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      alert(data.message);
      window.location.reload();

    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const getSubscriptionInfo = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          color: 'bg-gray-100 text-gray-700',
          icon: Users,
          name: 'Free Plan',
          limit: '3 analyses per month',
          features: ['Basic analysis', 'Standard reports'],
        };
      case 'professional':
        return {
          color: 'bg-blue-100 text-blue-700',
          icon: TrendingUp,
          name: 'Professional',
          limit: 'Unlimited analyses',
          features: ['Advanced analysis', 'Detailed reports', 'Historical data'],
        };
      case 'team':
        return {
          color: 'bg-purple-100 text-purple-700',
          icon: Crown,
          name: 'Team',
          limit: 'Unlimited analyses',
          features: ['All Professional features', 'Multi-user collaboration', 'API access'],
        };
      default:
        return getSubscriptionInfo('free');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const subscriptionInfo = getSubscriptionInfo(user.subscriptionTier);
  const remainingAnalyses = user.subscriptionTier === 'free'
    ? Math.max(0, 3 - user.monthlyAnalysisCount)
    : 'Unlimited';

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
              <h1 className="text-xl font-semibold text-gray-900">
                App Review Analyzer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Analyze App
              </button>
              <button
                onClick={() => router.push('/dashboard/history')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                History
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name || user.email}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's your app analysis dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalAnalyses || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.thisMonthAnalyses || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {remainingAnalyses}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Reviews</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.averageReviewCount || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${subscriptionInfo.color}`}>
                  <subscriptionInfo.icon className="w-4 h-4 mr-1" />
                  {subscriptionInfo.name}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Analyses Limit</p>
                  <p className="font-medium text-gray-900">{subscriptionInfo.limit}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Features</p>
                  <ul className="space-y-1">
                    {subscriptionInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 001.414-1.414l-1.293-1.293z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {user.subscriptionTier === 'free' ? (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={handleManageSubscription}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Manage Subscription
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Instagram Analysis</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Completed</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">TikTok Analysis</p>
                    <p className="text-xs text-gray-500">5 days ago</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Completed</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">YouTube Analysis</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Processing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Analyze New App</p>
                      <p className="text-xs text-gray-500">Start a new analysis</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/history')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">View History</p>
                      <p className="text-xs text-gray-500">Browse past analyses</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/compare')}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Compare Apps</p>
                      <p className="text-xs text-gray-500">Competitor analysis</p>
                    </div>
                  </div>
                </button>

                {user.subscriptionTier === 'free' && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <Crown className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Upgrade Plan</p>
                        <p className="text-xs text-gray-500">Get unlimited analyses</p>
                      </div>
                    </div>
                  </button>
                )}

                <button
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <Settings className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Settings</p>
                      <p className="text-xs text-gray-500">Manage your account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}