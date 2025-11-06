// Enhanced Error Handling Utilities
import { NextResponse } from 'next/server';

export interface ErrorDetails {
  code: string;
  message: string;
  suggestions: string[];
  retry?: boolean;
  userFriendly: boolean;
}

export class AppAnalysisError extends Error {
  public readonly code: string;
  public readonly suggestions: string[];
  public readonly retry: boolean;
  public readonly userFriendly: boolean;
  public readonly statusCode: number;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    suggestions: string[] = [],
    retry: boolean = false
  ) {
    super(message);
    this.name = 'AppAnalysisError';
    this.code = code;
    this.suggestions = suggestions;
    this.retry = retry;
    this.userFriendly = statusCode < 500; // 4xx errors are user-friendly
    this.statusCode = statusCode;
  }
}

// Predefined error types
export const ERROR_TYPES = {
  INVALID_URL: {
    code: 'INVALID_URL',
    message: 'Invalid app URL format',
    statusCode: 400,
    suggestions: [
      'Check that the URL is complete and correct',
      'Include the full domain (https://apps.apple.com/ or https://play.google.com/)',
      'Copy the URL directly from the app store'
    ],
    retry: false
  },

  APP_NOT_FOUND: {
    code: 'APP_NOT_FOUND',
    message: 'App not found in store',
    statusCode: 404,
    suggestions: [
      'Verify the app is still available in the store',
      'Try the US version of the app store URL',
      'Check if the app ID or package name is correct'
    ],
    retry: true
  },

  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    statusCode: 503,
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'If the problem persists, contact support'
    ],
    retry: true
  },

  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    statusCode: 429,
    suggestions: [
      'Wait a few minutes before trying again',
      'Consider using deep analysis mode for more comprehensive results'
    ],
    retry: true
  },

  ANALYSIS_TIMEOUT: {
    code: 'ANALYSIS_TIMEOUT',
    message: 'Analysis took too long to complete',
    statusCode: 408,
    suggestions: [
      'Try with deep analysis mode disabled',
      'The app might have too many reviews to process',
      'Contact support for assistance with large apps'
    ],
    retry: false
  },

  AI_SERVICE_ERROR: {
    code: 'AI_SERVICE_ERROR',
    message: 'AI analysis service unavailable',
    statusCode: 503,
    suggestions: [
      'Try again in a few minutes',
      'The AI service might be temporarily overloaded',
      'Contact support if the problem persists'
    ],
    retry: true
  },

  INVALID_PLATFORM: {
    code: 'INVALID_PLATFORM',
    message: 'Invalid platform specified',
    statusCode: 400,
    suggestions: [
      'Use either "ios" or "android" as the platform',
      'Make sure the URL matches the selected platform'
    ],
    retry: false
  },

  QUOTA_EXCEEDED: {
    code: 'QUOTA_EXCEEDED',
    message: 'Analysis quota exceeded',
    statusCode: 429,
    suggestions: [
      'Upgrade to a higher plan for more analyses',
      'Wait until your quota resets',
      'Use cached results when available'
    ],
    retry: false
  }
} as const;

// Create typed error instances
export function createError(errorType: keyof typeof ERROR_TYPES, customMessage?: string): AppAnalysisError {
  const errorConfig = ERROR_TYPES[errorType];
  return new AppAnalysisError(
    customMessage || errorConfig.message,
    errorConfig.code,
    errorConfig.statusCode,
    [...errorConfig.suggestions], // Convert readonly array to mutable array
    errorConfig.retry
  );
}

// Format error for API response
export function formatErrorResponse(error: AppAnalysisError | Error | unknown): NextResponse {
  console.error('[Error Handler]', error);

  if (error instanceof AppAnalysisError) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      suggestions: error.suggestions,
      retry: error.retry,
      timestamp: new Date().toISOString()
    }, {
      status: error.statusCode
    });
  }

  // Handle generic errors
  const genericError = error as Error;
  return NextResponse.json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    suggestions: [
      'Try again in a few moments',
      'If the problem persists, contact support',
      'Check the app URL and try again'
    ],
    retry: true,
    timestamp: new Date().toISOString(),
    debug: process.env.NODE_ENV === 'development' ? genericError.message : undefined
  }, {
    status: 500
  });
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof AppAnalysisError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error instanceof Error ? error.message : String(error));

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Network error detection
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('network') ||
    error.message.includes('timeout')
  );
}

// Platform-specific error handling
export function handlePlatformError(platform: 'ios' | 'android', error: Error): AppAnalysisError {
  if (isNetworkError(error)) {
    return createError('NETWORK_ERROR',
      `Failed to connect to ${platform === 'ios' ? 'App Store' : 'Google Play'}`
    );
  }

  if (error.message.includes('404') || error.message.includes('not found')) {
    return createError('APP_NOT_FOUND',
      `${platform === 'ios' ? 'iOS' : 'Android'} app not found`
    );
  }

  if (error.message.includes('403') || error.message.includes('forbidden')) {
    return createError('RATE_LIMITED',
      `${platform === 'ios' ? 'App Store' : 'Google Play'} access restricted`
    );
  }

  // Default error
  return createError('AI_SERVICE_ERROR',
    `Failed to analyze ${platform === 'ios' ? 'iOS' : 'Android'} app`
  );
}

// User-friendly error messages for frontend
export function getUserFriendlyMessage(error: AppAnalysisError): string {
  const friendlyMessages: Record<string, string> = {
    'INVALID_URL': '🔗 Please check your app store URL and try again',
    'APP_NOT_FOUND': '📱 We couldn\'t find this app. Please verify the URL',
    'NETWORK_ERROR': '🌐 Connection issue. Please check your internet and try again',
    'RATE_LIMITED': '⏱️ Too many requests. Please wait a moment and try again',
    'ANALYSIS_TIMEOUT': '⏰ Analysis took too long. Try with fewer reviews',
    'AI_SERVICE_ERROR': '🤖 AI service temporarily unavailable. Please try again',
    'INVALID_PLATFORM': '📱 Please select the correct platform for your app',
    'QUOTA_EXCEEDED': '📊 You\'ve reached your analysis limit. Upgrade for more'
  };

  return friendlyMessages[error.code] || error.message;
}

// Validation helpers
export function validateAppUrl(url: string, platform: 'ios' | 'android'): boolean {
  const patterns = {
    ios: /^https?:\/\/apps\.apple\.com\/.*\/id\d+/,
    android: /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=/
  };

  return patterns[platform].test(url);
}

export function sanitizeAppUrl(url: string): string {
  // Remove any trailing whitespace and ensure https
  return url.trim().replace(/^http:/, 'https:');
}

// Error logging for monitoring
export function logError(error: Error, context: Record<string, any> = {}): void {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    environment: process.env.NODE_ENV
  };

  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send to a monitoring service
    console.error('[PRODUCTION ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.error('[DEVELOPMENT ERROR]', logData);
  }
}