'use client';

import { useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '@/lib/performance';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

interface ApiMetrics {
  [key: string]: {
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

export default function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [webVitals, setWebVitals] = useState<PerformanceMetrics | null>(null);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics>({});
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Monitor Web Vitals
    const monitorWebVitals = () => {
      if ('performance' in window) {
        // First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
        const fcp = fcpEntry ? fcpEntry.startTime : 0;

        // Largest Contentful Paint
        let lcp = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        let fid = 0;
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'first-input') {
              fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let cls = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Update state periodically
        const updateMetrics = () => {
          setWebVitals({
            fcp: Math.round(fcp),
            lcp: Math.round(lcp),
            fid: Math.round(fid),
            cls: Math.round(cls * 1000) / 1000,
          });

          // Get API metrics
          setApiMetrics(performanceMonitor.getAllMetrics());
        };

        // Initial update and periodic updates
        updateMetrics();
        const interval = setInterval(updateMetrics, 5000);

        return () => {
          clearInterval(interval);
          observer.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      }
    };

    monitorWebVitals();

    // Add keyboard shortcut to toggle monitor (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  useEffect(() => {
    // Monitor DOM changes for layout shift detection
    if (typeof window !== 'undefined') {
      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Log potential layout shifts
            console.debug('DOM mutation detected:', {
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes?.length || 0,
            });
          }
        });
      });

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          title="Show Performance Monitor (Ctrl+Shift+P)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    );
  }

  const getScoreColor = (value: number, type: string) => {
    switch (type) {
      case 'fcp':
      case 'lcp':
        return value < 1800 ? 'text-green-600' : value < 3000 ? 'text-yellow-600' : 'text-red-600';
      case 'fid':
        return value < 100 ? 'text-green-600' : value < 300 ? 'text-yellow-600' : 'text-red-600';
      case 'cls':
        return value < 0.1 ? 'text-green-600' : value < 0.25 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getApiScoreColor = (avg: number) => {
    return avg < 100 ? 'text-green-600' : avg < 500 ? 'text-yellow-600' : 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-96 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Web Vitals */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Web Vitals</h4>
        {webVitals ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>First Contentful Paint:</span>
              <span className={`font-mono ${getScoreColor(webVitals.fcp, 'fcp')}`}>
                {webVitals.fcp}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Largest Contentful Paint:</span>
              <span className={`font-mono ${getScoreColor(webVitals.lcp, 'lcp')}`}>
                {webVitals.lcp}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>First Input Delay:</span>
              <span className={`font-mono ${getScoreColor(webVitals.fid, 'fid')}`}>
                {webVitals.fid}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cumulative Layout Shift:</span>
              <span className={`font-mono ${getScoreColor(webVitals.cls, 'cls')}`}>
                {webVitals.cls}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading metrics...</p>
        )}
      </div>

      {/* API Metrics */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">API Performance</h4>
        {Object.keys(apiMetrics).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(apiMetrics).map(([key, metrics]) => (
              <div key={key} className="text-xs">
                <div className="font-medium text-gray-700">{key}</div>
                <div className="grid grid-cols-3 gap-2 text-gray-600">
                  <div>Avg: <span className={getApiScoreColor(metrics.avg)}>{metrics.avg.toFixed(0)}ms</span></div>
                  <div>Min: <span>{metrics.min.toFixed(0)}ms</span></div>
                  <div>Max: <span>{metrics.max.toFixed(0)}ms</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No API metrics yet</p>
        )}
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 border-t pt-2">
        <p>Press Ctrl+Shift+P to toggle</p>
        <p>Optimal: FCP & LCP &lt;1.8s, FID &lt;100ms, CLS &lt;0.1</p>
      </div>
    </div>
  );
}