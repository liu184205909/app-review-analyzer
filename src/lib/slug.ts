// URL Slug Generation Utilities

/**
 * Generate SEO-friendly slug from app name and platform
 * @example generateAppSlug("Instagram", "ios") => "instagram-ios"
 * @example generateAppSlug("Slack: Team Chat", "android") => "slack-android"
 * @example generateAppSlug("Instagram Lite", "android") => "instagram-lite-android"
 * 
 * Note: Uniqueness is guaranteed by database constraints on (appId, platform)
 */
export function generateAppSlug(appName: string, platform: 'ios' | 'android'): string {
  // Remove special characters and normalize
  const normalized = appName
    .toLowerCase()
    .trim()
    // Remove everything after colon (e.g., "Slack: Team Chat" => "Slack")
    .split(':')[0]
    // Remove special characters except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length for SEO (50-60 chars is optimal)
    .substring(0, 50);

  return `${normalized}-${platform}`;
}

/**
 * Parse slug back to components
 * @example parseAppSlug("instagram-ios") => { appName: "instagram", platform: "ios" }
 */
export function parseAppSlug(slug: string): { appName: string; platform: 'ios' | 'android' } | null {
  const parts = slug.split('-');
  if (parts.length < 2) return null;

  const platform = parts[parts.length - 1];
  if (platform !== 'ios' && platform !== 'android') return null;

  const appName = parts.slice(0, -1).join('-');
  
  return { appName, platform: platform as 'ios' | 'android' };
}

/**
 * Check if analysis is recent (intelligent caching based on app popularity)
 * 
 * Cache duration strategy:
 * - Hot apps (>100K reviews): 24 hours
 * - Popular apps (10K-100K): 7 days
 * - Normal apps (1K-10K): 14 days
 * - Niche apps (<1K): 30 days
 */
export function isAnalysisRecent(
  createdAt: Date, 
  reviewCount?: number,
  customHours?: number
): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // If custom hours specified, use that
  if (customHours !== undefined) {
    return diffHours < customHours;
  }
  
  // Intelligent caching based on app popularity
  let cacheHours = 24 * 30; // Default: 30 days for niche apps
  
  if (reviewCount !== undefined) {
    if (reviewCount >= 100000) {
      cacheHours = 24; // Hot apps: 24 hours
    } else if (reviewCount >= 10000) {
      cacheHours = 24 * 7; // Popular apps: 7 days
    } else if (reviewCount >= 1000) {
      cacheHours = 24 * 14; // Normal apps: 14 days
    } else {
      cacheHours = 24 * 30; // Niche apps: 30 days
    }
  }
  
  return diffHours < cacheHours;
}

/**
 * Get cache duration in days based on review count
 */
export function getCacheDuration(reviewCount: number): number {
  if (reviewCount >= 100000) return 1;   // 1 day
  if (reviewCount >= 10000) return 7;    // 7 days
  if (reviewCount >= 1000) return 14;    // 14 days
  return 30;                              // 30 days
}

/**
 * Format "time ago" text
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

