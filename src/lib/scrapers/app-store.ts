// App Store Review Scraper (RSS Feed)

export interface AppStoreReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: Date;
  appVersion: string;
}

export interface AppStoreApp {
  id: string;
  name: string;
  bundleId: string;
  iconUrl: string;
  rating: number;
  reviewCount: number;
  developer: string;
  category?: string; // Primary genre/category
}

/**
 * Fetch reviews from App Store RSS Feed
 * @param appId - App Store numeric ID (e.g., "id123456789" or "123456789")
 * @param country - Country code (e.g., "us", "gb", "cn")
 * @param sortBy - Sort order: "mostRecent" or "mostHelpful"
 * @param page - Page number (1-10)
 */
export async function fetchAppStoreReviews(
  appId: string,
  country: string = 'us',
  sortBy: 'mostRecent' | 'mostHelpful' = 'mostRecent',
  page: number = 1
): Promise<AppStoreReview[]> {
  
  // Clean app ID (remove "id" prefix if present)
  const cleanAppId = appId.replace(/^id/, '');
  
  // App Store RSS Feed URL
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${cleanAppId}/sortBy=${sortBy}/page=${page}/json`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`App Store API returned ${response.status}`);
    }

    const data = await response.json();
    
    // RSS feed returns entries, skip first entry (it's metadata)
    const entries = data.feed?.entry || [];
    
    if (entries.length === 0) {
      return [];
    }

    // First entry is app info, rest are reviews
    const reviews = entries.slice(1).map((entry: any) => ({
      id: entry.id.label,
      author: entry.author?.name?.label || 'Anonymous',
      rating: parseInt(entry['im:rating']?.label || '0'),
      title: entry.title?.label || '',
      content: entry.content?.label || '',
      date: new Date(entry.updated?.label || Date.now()),
      appVersion: entry['im:version']?.label || 'Unknown',
    }));

    return reviews;
  } catch (error) {
    console.error('Error fetching App Store reviews:', error);
    throw new Error('Failed to fetch App Store reviews');
  }
}

/**
 * Fetch app metadata from App Store
 */
export async function fetchAppStoreApp(
  appId: string,
  country: string = 'us'
): Promise<AppStoreApp | null> {

  const cleanAppId = appId.replace(/^id/, '');
  const url = `https://itunes.apple.com/lookup?id=${cleanAppId}&country=${country}`;

  try {
    console.log(`[App Store] Fetching from: ${country} store for app: ${cleanAppId}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log(`[App Store] No results found for app ${cleanAppId} in ${country} store`);
      return null;
    }

    const app = data.results[0];
    console.log(`[App Store] Found app: ${app.trackName} (${app.bundleId})`);

    return {
      id: app.trackId.toString(),
      name: app.trackName,
      bundleId: app.bundleId,
      iconUrl: app.artworkUrl512 || app.artworkUrl100,
      rating: app.averageUserRating || 0,
      reviewCount: app.userRatingCount || 0,
      developer: app.artistName,
      category: app.primaryGenreName || app.genres?.[0] || undefined, // Primary genre/category
    };
  } catch (error: any) {
    console.error(`[App Store] Error fetching app info (${country}):`, {
      appId: cleanAppId,
      error: error.message,
      status: error.status || 'N/A',
      url: url.replace(/id=\d+/, 'id=***') // Hide app ID in logs
    });
    return null;
  }
}

/**
 * Extract App Store ID from various URL formats
 */
export function extractAppStoreId(input: string): string | null {
  // Direct ID
  if (/^\d+$/.test(input)) {
    return input;
  }
  
  // URL formats:
  // https://apps.apple.com/us/app/app-name/id123456789
  // https://apps.apple.com/app/id123456789
  const match = input.match(/\/id(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch multiple pages of reviews
 * Note: App Store RSS Feed API has a limit of 10 pages
 */
export async function fetchAppStoreReviewsMultiPage(
  appId: string,
  country: string = 'us',
  maxPages: number = 5
): Promise<AppStoreReview[]> {
  
  // Enforce API limit: max 10 pages
  const safeMaxPages = Math.min(maxPages, 10);
  
  const allReviews: AppStoreReview[] = [];
  
  for (let page = 1; page <= safeMaxPages; page++) {
    try {
      const reviews = await fetchAppStoreReviews(appId, country, 'mostRecent', page);
      
      if (reviews.length === 0) {
        break; // No more reviews
      }
      
      allReviews.push(...reviews);
      
      // ⚡ Removed rate limiting for faster scraping
      // Apple's RSS feed can handle concurrent requests
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  return allReviews;
}

