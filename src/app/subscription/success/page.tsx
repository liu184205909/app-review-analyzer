'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsVerifying(false);
      return;
    }

    const verifySubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?returnUrl=' + encodeURIComponent('/subscription/success?' + searchParams.toString()));
          return;
        }

        // In a real implementation, you'd verify the session with your backend
        // For now, we'll simulate success after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSubscriptionData({
          plan: 'Professional',
          billingCycle: 'Monthly',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        });
        setIsVerifying(false);

      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify subscription');
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [sessionId, router, searchParams]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verifying your subscription...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/pricing"
              className="block w-full bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
              App Review Analyzer
            </Link>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome aboard! 🎉
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Your subscription has been activated successfully. You're all set to start analyzing apps with advanced features.
          </p>

          {subscriptionData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Subscription Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">{subscriptionData.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="font-medium text-gray-900">{subscriptionData.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing:</span>
                  <span className="font-medium text-gray-900">{subscriptionData.nextBillingDate}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <div className="pt-4">
              <p className="text-gray-600 mb-4">What's next?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Analyze Apps</h4>
                  <p className="text-sm text-gray-600">Start analyzing any app with unlimited reviews</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📈 Track Trends</h4>
                  <p className="text-sm text-gray-600">Monitor your app's performance over time</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📥 Export Data</h4>
                  <p className="text-sm text-gray-600">Download your analysis in various formats</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Need help?{' '}
            <Link href="mailto:support@appreviewanalyzer.com" className="text-indigo-600 hover:text-indigo-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}