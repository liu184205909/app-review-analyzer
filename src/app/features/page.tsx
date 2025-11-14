'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import {
  BarChart3,
  Zap,
  Globe,
  TrendingUp,
  Users,
  Shield,
  Database,
  Clock,
  Target,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  Star,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-600" />,
      title: 'AI-Powered Analysis',
      description: 'Advanced sentiment analysis and topic extraction using state-of-the-art NLP models to understand user feedback deeply.',
      highlights: ['GPT-4 integration', 'Multi-language support', 'Context-aware insights']
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-green-600" />,
      title: 'Competitor Comparison',
      description: 'Side-by-side analysis of your app against competitors to identify opportunities and threats in your market.',
      highlights: ['Feature gap analysis', 'Sentiment comparison', 'Market positioning insights']
    },
    {
      icon: <Globe className="w-12 h-12 text-purple-600" />,
      title: 'Multi-Platform Support',
      description: 'Analyze reviews from both iOS App Store and Google Play Store with unified insights across platforms.',
      highlights: ['iOS App Store', 'Google Play Store', 'Cross-platform trends']
    },
    {
      icon: <Target className="w-12 h-12 text-red-600" />,
      title: 'Smart Prioritization',
      description: 'Automatically identify and prioritize the most impactful user needs based on frequency and sentiment.',
      highlights: ['Impact scoring', 'Frequency analysis', 'Trend detection']
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-indigo-600" />,
      title: 'Review Categorization',
      description: 'Intelligent categorization of reviews by topic, feature, and sentiment for easy navigation.',
      highlights: ['Auto-tagging', 'Custom categories', 'Smart filtering']
    },
    {
      icon: <Lightbulb className="w-12 h-12 text-yellow-600" />,
      title: 'Actionable Insights',
      description: 'Get specific, actionable recommendations for product improvements based on user feedback patterns.',
      highlights: ['Quick wins', 'Strategic opportunities', 'Risk mitigation']
    }
  ];

  const additionalFeatures = [
    {
      icon: <Database className="w-6 h-6 text-blue-600" />,
      title: 'Incremental Data Collection',
      description: 'Smart scraping that only fetches new reviews, saving time and resources.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-green-600" />,
      title: 'Auto-Deduplication',
      description: 'Intelligent detection and removal of duplicate reviews for cleaner data.'
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      title: 'Historical Tracking',
      description: 'Track sentiment and feature requests over time to identify trends.'
    },
    {
      icon: <Download className="w-6 h-6 text-purple-600" />,
      title: 'Export Capabilities',
      description: 'Export analysis results in multiple formats (PDF, Excel, JSON).'
    },
    {
      icon: <Users className="w-6 h-6 text-pink-600" />,
      title: 'Team Collaboration',
      description: 'Share insights with your team and collaborate on product decisions.'
    },
    {
      icon: <Shield className="w-6 h-6 text-teal-600" />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and secure data handling for enterprise clients.'
    },
    {
      icon: <Star className="w-6 h-6 text-yellow-600" />,
      title: 'Rating Analysis',
      description: 'Deep dive into rating distributions and correlation with feedback.'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
      title: 'Sentiment Trends',
      description: 'Visualize sentiment changes over time with beautiful charts.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Powerful Features for
          <span className="text-blue-600"> Data-Driven Decisions</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Transform user reviews into actionable insights with our comprehensive suite of AI-powered analysis tools
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="bg-gray-100 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Core Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.highlights.map((highlight, hIndex) => (
                  <li key={hIndex} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Additional Capabilities
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enter App URL
              </h3>
              <p className="text-gray-600">
                Simply paste the App Store or Google Play URL of the app you want to analyze
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Analysis
              </h3>
              <p className="text-gray-600">
                Our AI processes thousands of reviews to extract meaningful insights
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Insights
              </h3>
              <p className="text-gray-600">
                Receive actionable recommendations and detailed reports in minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Unlock Your App's Potential?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of product teams using ReviewInsight to build better products
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}

