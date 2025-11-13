// Performance optimization utilities
import React from 'react';

// Memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTiming(key: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(key, duration);
    };
  }

  recordMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const values = this.metrics.get(key)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(key: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(key);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [key] of this.metrics.entries()) {
      const metrics = this.getMetrics(key);
      if (metrics) {
        result[key] = metrics;
      }
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limitMs);
    }
  };
}

// Memoized fetch with caching
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options || {})}`;

  // Try cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Cache the result
  cache.set(cacheKey, data, ttlMs);

  return data;
}

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sizes
  generateSizes: (baseWidth: number, breakpoints: number[] = [640, 768, 1024, 1280]) => {
    return breakpoints
      .map(bp => `(max-width: ${bp}px) ${Math.min(baseWidth, bp)}px`)
      .concat(`${baseWidth}px`)
      .join(', ');
  },

  // Generate srcset for images
  generateSrcSet: (baseUrl: string, sizes: number[]) => {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  },

  // Get placeholder image
  getPlaceholder: (width: number = 48, height: number = 48, text?: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(text || 'App')}&background=6366f1&color=fff&size=${Math.max(width, height)}`;
  },
};

// Bundle size optimization utilities
export const bundleOptimization = {
  // Lazy load components
  lazyLoad: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFunc);
  },

  // Preload resources
  preloadResource: (href: string, as: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      document.head.appendChild(link);
    }
  },

  // Prefetch pages
  prefetchPage: (url: string) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      });
    }
  },
};

// Database query optimization
export const dbOptimization = {
  // Create optimized database queries
  createOptimizedQuery: (baseQuery: any, optimizations: {
    select?: string[];
    include?: any;
    where?: any;
    orderBy?: any;
    take?: number;
    skip?: number;
    cacheKey?: string;
    ttlMs?: number;
  }) => {
    let query = baseQuery;

    if (optimizations.select) {
      query = query.select(optimizations.select);
    }

    if (optimizations.include) {
      query = query.include(optimizations.include);
    }

    if (optimizations.where) {
      query = query.where(optimizations.where);
    }

    if (optimizations.orderBy) {
      query = query.orderBy(optimizations.orderBy);
    }

    if (optimizations.take !== undefined) {
      query = query.take(optimizations.take);
    }

    if (optimizations.skip !== undefined) {
      query = query.skip(optimizations.skip);
    }

    return {
      query,
      cacheKey: optimizations.cacheKey,
      ttlMs: optimizations.ttlMs,
    };
  },

  // Execute cached query
  async executeCachedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const endTiming = performanceMonitor.startTiming(`db_query_${cacheKey}`);

    try {
      const result = await queryFn();
      cache.set(cacheKey, result, ttlMs);
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  },
};

// API response optimization
export const apiOptimization = {
  // Compress large responses
  compressResponse: (data: any): string => {
    // In production, you might use actual compression
    return JSON.stringify(data);
  },

  // Add caching headers
  getCacheHeaders: (maxAge: number = 300) => ({
    'Cache-Control': `public, max-age=${maxAge}`,
    'ETag': Date.now().toString(),
  }),

  // Rate limiting helper
  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>();

    return (clientId: string): boolean => {
      const now = Date.now();
      const clientRequests = requests.get(clientId) || [];

      // Remove old requests outside the window
      const validRequests = clientRequests.filter(time => now - time < windowMs);

      if (validRequests.length >= maxRequests) {
        return false; // Rate limited
      }

      validRequests.push(now);
      requests.set(clientId, validRequests);
      return true; // Allowed
    };
  },
};

// Cleanup interval for cache
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000); // Cleanup every 5 minutes
}

export default {
  cache,
  performanceMonitor,
  debounce,
  throttle,
  cachedFetch,
  imageOptimization,
  bundleOptimization,
  dbOptimization,
  apiOptimization,
};