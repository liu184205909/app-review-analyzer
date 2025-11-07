// Google Play Store Review Scraper
import gplay from 'google-play-scraper';

export interface GooglePlayReview {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  date: Date;
  appVersion: string;
  thumbsUp: number;
}

export interface GooglePlayApp {
  id: string;
  name: string;
  bundleId: string;
  iconUrl: string;
  rating: number;
  reviewCount: number;
  developer: string;
  category?: string; // App category/genre
}

/**
 * Fetch reviews from Google Play Store
 * @param appId - Package name (e.g., "com.example.app")
 * @param country - Country code (e.g., "us", "gb")
 * @param lang - Language code (e.g., "en", "zh")
 * @param num - Number of reviews to fetch (max 500 per call)
 * @param sort - Sort order: NEWEST, RATING, HELPFULNESS
 */
export async function fetchGooglePlayReviews(
  appId: string,
  options: {
    country?: string;
    lang?: string;
    num?: number;
    sort?: 'NEWEST' | 'RATING' | 'HELPFULNESS';
  } = {}
): Promise<GooglePlayReview[]> {
  
  const {
    country = 'us',
    lang = 'en',
    num = 500,
    sort = 'NEWEST',
  } = options;

  try {
    const reviews = await gplay.reviews({
      appId,
      sort: gplay.sort[sort],
      num,
      lang,
      country,
    }) as any;

    return reviews.data.map((review: any) => ({
      id: review.id,
      author: review.userName || 'Anonymous',
      rating: review.score,
      title: review.title || undefined,
      content: review.text,
      date: new Date(review.date),
      appVersion: review.version || 'Unknown',
      thumbsUp: review.thumbsUp || 0,
    }));
  } catch (error) {
    console.error('Error fetching Google Play reviews:', error);
    throw new Error('Failed to fetch Google Play reviews');
  }
}

/**
 * Fetch app metadata from Google Play Store
 */
export async function fetchGooglePlayApp(
  appId: string,
  country: string = 'us',
  lang: string = 'en'
): Promise<GooglePlayApp | null> {

  try {
    console.log(`[Google Play] Fetching from: ${country} store for app: ${appId}`);

    // Set timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
    });

    const appPromise = gplay.app({
      appId,
      lang,
      country,
      throttle: 10, // Add throttling to avoid being blocked
    });

    const app = await Promise.race([appPromise, timeoutPromise]) as any;

    console.log(`[Google Play] Successfully fetched: ${app.title} (${app.appId})`);

    return {
      id: app.appId,
      name: app.title,
      bundleId: app.appId,
      iconUrl: app.icon,
      rating: app.score || 0,
      reviewCount: app.reviews || 0,
      developer: app.developer,
      category: app.genre || (app as any).category || undefined, // App category/genre
    };
  } catch (error: any) {
    console.error('❌ [Google Play] Error details:', {
      appId: appId.replace(/([a-zA-Z0-9])\w+@/, '$1***@'), // Hide part of package ID
      error: error.message,
      code: error.code || 'N/A',
      country,
      lang,
      isNetworkError: error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND',
      isPermissionError: error.message?.includes('403') || error.message?.includes('Forbidden'),
    });

    // Don't return null immediately, try alternative approach
    try {
      console.log(`[Google Play] Trying alternative approach for: ${appId}`);

      // Try with different country
      const fallbackApp = await gplay.app({
        appId,
        lang: 'en',
        country: 'us', // Always try US as fallback
        throttle: 5,
      });

      return {
        id: fallbackApp.appId,
        name: fallbackApp.title,
        bundleId: fallbackApp.appId,
        iconUrl: fallbackApp.icon,
        rating: fallbackApp.score || 0,
        reviewCount: fallbackApp.reviews || 0,
        developer: fallbackApp.developer,
        category: fallbackApp.genre || (fallbackApp as any).category || undefined,
      };
    } catch (fallbackError: any) {
      console.error('❌ [Google Play] Fallback also failed:', {
        appId: appId.replace(/([a-zA-Z0-9])\w+@/, '$1***@'),
        error: fallbackError.message,
      });
      return null;
    }
  }
}

/**
 * Extract Google Play package name from various URL formats
 */
export function extractGooglePlayId(input: string): string | null {
  // Direct package name
  if (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(input)) {
    return input;
  }
  
  // URL formats:
  // https://play.google.com/store/apps/details?id=com.example.app
  const match = input.match(/[?&]id=([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)/i);
  return match ? match[1] : null;
}

/**
 * Fetch reviews with pagination and enhanced options
 */
export async function fetchGooglePlayReviewsMultiPage(
  appId: string,
  options: {
    country?: string;
    lang?: string;
    maxReviews?: number;
    deepMode?: boolean;
  } = {}
): Promise<GooglePlayReview[]> {

  const {
    country = 'us',
    lang = 'en',
    maxReviews = 1000,
    deepMode = false,
  } = options;

  try {
    // Google Play Scraper has a limit of 500 reviews per request
    // For deep mode, we'll fetch multiple batches with different sorting
    const targetReviews = Math.min(maxReviews, 1000);
    const batchSize = Math.min(500, targetReviews);

    // First batch: most recent reviews
    const recentReviews = await fetchGooglePlayReviews(appId, {
      country,
      lang,
      num: batchSize,
      sort: 'NEWEST',
    });

    console.log(`[Google Play] Fetched ${recentReviews.length} recent reviews`);

    // If we need more reviews and deep mode is enabled, fetch additional batches
    if (deepMode && recentReviews.length < targetReviews) {
      try {
        // Second batch: most helpful reviews (different sorting)
        const helpfulReviews = await fetchGooglePlayReviews(appId, {
          country,
          lang,
          num: Math.min(500, targetReviews - recentReviews.length),
          sort: 'HELPFULNESS',
        });

        console.log(`[Google Play] Fetched ${helpfulReviews.length} helpful reviews`);

        // Combine and deduplicate
        const allReviews = [...recentReviews];
        const seenIds = new Set(recentReviews.map(r => r.id));

        for (const review of helpfulReviews) {
          if (!seenIds.has(review.id)) {
            allReviews.push(review);
            seenIds.add(review.id);
          }
        }

        console.log(`[Google Play] Total unique reviews: ${allReviews.length}`);
        return allReviews.slice(0, targetReviews);
      } catch (error) {
        console.warn('[Google Play] Failed to fetch additional reviews, using only recent reviews:', error);
        return recentReviews;
      }
    }

    return recentReviews.slice(0, targetReviews);
  } catch (error) {
    console.error('Error fetching Google Play reviews:', error);
    throw new Error('Failed to fetch Google Play reviews');
  }
}

/**
 * Fetch reviews from multiple countries for comprehensive coverage
 */
export async function fetchGooglePlayReviewsMultiCountry(
  appId: string,
  targetCount: number = 1000,
  customCountries?: string[]
): Promise<GooglePlayReview[]> {
  const countries = customCountries || ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'br'];
  const allReviews: GooglePlayReview[] = [];
  const seenIds = new Set<string>();

  for (const country of countries) {
    if (allReviews.length >= targetCount) {
      break;
    }

    try {
      const reviews = await fetchGooglePlayReviewsMultiPage(appId, {
        country,
        maxReviews: Math.min(500, targetCount - allReviews.length),
        deepMode: false, // Don't use deep mode for multi-country
      });

      // Deduplicate reviews by ID
      const newReviews = reviews.filter(review => {
        if (seenIds.has(review.id)) {
          return false;
        }
        seenIds.add(review.id);
        return true;
      });

      allReviews.push(...newReviews);
      console.log(`[Google Play] ${country}: ${newReviews.length} new reviews (total: ${allReviews.length})`);

      // Add delay between countries to avoid rate limiting
      if (country !== countries[countries.length - 1]) {
        await delay(500); // Reduced from 1000ms for faster processing
      }
    } catch (error) {
      console.error(`Error fetching from ${country}:`, error);
    }
  }

  console.log(`[Google Play] Total unique reviews: ${allReviews.length}`);
  return allReviews;
}

/**
 * Rate limiting helper
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

