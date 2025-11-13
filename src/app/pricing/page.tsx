'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, Zap, Users, Crown, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering - do not prerender at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  popular?: boolean;
  monthlyAnalyses: number;
  maxReviews: number;
}

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '3 analyses per month',
        'Basic app insights',
        'Standard reports',
        'Email support',
        '500 reviews per analysis',
      ],
      icon: Users,
      color: 'from-gray-600 to-gray-800',
      monthlyAnalyses: 3,
      maxReviews: 500,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'yearly' ? '$24' : '$29',
      period: billingCycle === 'yearly' ? '/month' : '/month',
      description: 'For professional developers',
      features: [
        'Unlimited analyses',
        'Advanced AI insights',
        'Detailed reports with trends',
        'Historical data tracking',
        'Priority email support',
        '2000 reviews per analysis',
        'Data export (CSV, JSON)',
        'Custom report templates',
      ],
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
      popular: true,
      monthlyAnalyses: -1,
      maxReviews: 2000,
    },
    {
      id: 'team',
      name: 'Team',
      price: billingCycle === 'yearly' ? '$79' : '$99',
      period: billingCycle === 'yearly' ? '/month' : '/month',
      description: 'For teams and agencies',
      features: [
        'All Professional features',
        'Multiple user accounts',
        'Team collaboration tools',
        'API access (1000 requests/month)',
        'Custom integrations',
        'Phone support',
        '5000 reviews per analysis',
        'White-label reports',
        'Dedicated account manager',
      ],
      icon: Crown,
      color: 'from-purple-600 to-purple-800',
      monthlyAnalyses: -1,
      maxReviews: 5000,
    },
  ];

  const handleSubscribe = async (planId: string) => {
    try {
      if (planId === 'free') {
        router.push('/register');
        return;
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        // Redirect to login with return URL
        router.push(`/login?returnUrl=${encodeURIComponent('/pricing')}`);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tier: planId,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Error subscribing:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const getYearlyDiscount = (monthlyPrice: string, yearlyPrice: string) => {
    const monthly = parseFloat(monthlyPrice.replace('$', ''));
    const yearly = parseFloat(yearlyPrice.replace('$', ''));
    return Math.round(((monthly * 12 - yearly * 12) / (monthly * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                App Review Analyzer
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the perfect plan for your app analysis needs. No hidden fees, cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 ml-4 mr-4 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transform transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
          </span>
          <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const yearlyDiscount = plan.id !== 'free' ? getYearlyDiscount('$29', '$24') : null;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-indigo-500 ring-offset-8 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-indigo-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`p-6 bg-gradient-to-r ${plan.color} text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <plan.icon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm ml-1 opacity-90">{plan.period}</span>
                    </div>
                    {plan.id !== 'free' && yearlyDiscount && (
                      <p className="text-xs mt-1 opacity-90">
                        Save {yearlyDiscount}% annually
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-sm opacity-90">{plan.description}</p>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Analysis Limits:</strong>
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly analyses</span>
                        <span className="font-medium text-gray-900">
                          {plan.monthlyAnalyses === -1 ? 'Unlimited' : plan.monthlyAnalyses}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Max reviews</span>
                        <span className="font-medium text-gray-900">{plan.maxReviews}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-sm font-medium text-gray-900 mb-4">Features:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.id === 'free'
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.id === 'free' ? 'Get Started Free' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently asked questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              What happens if I exceed my free plan limit?
            </h3>
            <p className="text-gray-600">
              You'll be prompted to upgrade to continue analyzing apps. Your data is always preserved.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600">
              We offer a 30-day money-back guarantee for all paid plans if you're not satisfied.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Is my data secure?
            </h3>
            <p className="text-gray-600">
              Yes. We use bank-level encryption and never share your data with third parties.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600">
              Absolutely. You can cancel your subscription at any time with no cancellation fees.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Do you offer enterprise plans?
            </h3>
            <p className="text-gray-600">
              Yes! Contact our sales team for custom enterprise solutions and pricing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 text-center pb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to get started?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of developers who trust our app analysis platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="mailto:support@appreviewanalyzer.com"
            className="bg-white text-indigo-600 border border-indigo-300 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}