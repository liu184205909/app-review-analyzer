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
    });

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
    console.log(`[Google Play] Fetching app info for: ${appId}`);
    
    const app = await gplay.app({
      appId,
      lang,
      country,
    });

    console.log(`[Google Play] Successfully fetched: ${app.title}`);

    return {
      id: app.appId,
      name: app.title,
      bundleId: app.appId,
      iconUrl: app.icon,
      rating: app.score || 0,
      reviewCount: app.reviews || 0,
      developer: app.developer,
    };
  } catch (error: any) {
    console.error('❌ [Google Play] Error details:', {
      appId,
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    return null;
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
 * Fetch reviews with pagination
 */
export async function fetchGooglePlayReviewsMultiPage(
  appId: string,
  options: {
    country?: string;
    lang?: string;
    maxReviews?: number;
  } = {}
): Promise<GooglePlayReview[]> {
  
  const {
    country = 'us',
    lang = 'en',
    maxReviews = 500,
  } = options;

  try {
    // Google Play Scraper has built-in pagination
    const reviews = await fetchGooglePlayReviews(appId, {
      country,
      lang,
      num: Math.min(maxReviews, 500),
      sort: 'NEWEST',
    });

    return reviews;
  } catch (error) {
    console.error('Error fetching Google Play reviews:', error);
    throw new Error('Failed to fetch Google Play reviews');
  }
}

/**
 * Rate limiting helper
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

