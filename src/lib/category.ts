// Category Mapping Utilities
// Maps iOS and Android categories to unified category names

// iOS App Store categories (from primaryGenreName)
// Android Play Store categories (from genre)
// Both are mapped to unified categories

export interface UnifiedCategory {
  name: string;
  displayName: string;
  icon?: string;
}

// Unified category mapping
const CATEGORY_MAP: Record<string, string> = {
  // iOS categories
  'Social Networking': 'Social Media',
  'Photo & Video': 'Photo & Video',
  'Games': 'Games',
  'Productivity': 'Productivity',
  'Utilities': 'Utilities',
  'Shopping': 'Shopping',
  'Entertainment': 'Entertainment',
  'News': 'News',
  'Music': 'Music',
  'Education': 'Education',
  'Health & Fitness': 'Health & Fitness',
  'Travel': 'Travel',
  'Food & Drink': 'Food & Drink',
  'Finance': 'Finance',
  'Business': 'Business',
  'Lifestyle': 'Lifestyle',
  'Sports': 'Sports',
  'Weather': 'Weather',
  'Reference': 'Reference',
  'Medical': 'Medical',
  'Book': 'Books',
  'Navigation': 'Navigation',
  'Catalogs': 'Catalogs',
  
  // Android categories (uppercase)
  'SOCIAL': 'Social Media',
  'PHOTOGRAPHY': 'Photo & Video',
  'GAME': 'Games',
  'PRODUCTIVITY': 'Productivity',
  'TOOLS': 'Utilities',
  'SHOPPING': 'Shopping',
  'ENTERTAINMENT': 'Entertainment',
  'NEWS_AND_MAGAZINES': 'News',
  'MUSIC_AND_AUDIO': 'Music',
  'EDUCATION': 'Education',
  'HEALTH_AND_FITNESS': 'Health & Fitness',
  'TRAVEL_AND_LOCAL': 'Travel',
  'FOOD_AND_DRINK': 'Food & Drink',
  'FINANCE': 'Finance',
  'BUSINESS': 'Business',
  'LIFESTYLE': 'Lifestyle',
  'SPORTS': 'Sports',
  'WEATHER': 'Weather',
  'LIBRARIES_AND_DEMO': 'Reference',
  'MEDICAL': 'Medical',
  'BOOKS_AND_REFERENCE': 'Books',
  'MAPS_AND_NAVIGATION': 'Navigation',
  'COMICS': 'Comics',
  'ART_AND_DESIGN': 'Art & Design',
  'VIDEO_PLAYERS': 'Video Players',
  'COMMUNICATION': 'Communication',
  'AUTO_AND_VEHICLES': 'Auto & Vehicles',
  'DATING': 'Dating',
  'HOUSE_AND_HOME': 'Home & Garden',
  'PARENTING': 'Parenting',
  'EVENTS': 'Events',
};

// Popular categories for browsing
export const POPULAR_CATEGORIES = [
  'Social Media',
  'Games',
  'Productivity',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Photo & Video',
  'News',
  'Music',
  'Education',
  'Health & Fitness',
  'Travel',
  'Finance',
  'Business',
];

/**
 * Normalize category name from iOS/Android to unified format
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return 'Uncategorized';
  
  // Check if already unified
  if (CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category];
  }
  
  // Try case-insensitive match
  const normalized = category.trim();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return value;
    }
  }
  
  // Return as-is if no match found
  return normalized;
}

/**
 * Get category display name with icon/emoji
 */
export function getCategoryDisplay(category: string): { name: string; icon: string } {
  const normalized = normalizeCategory(category);
  
  const categoryIcons: Record<string, string> = {
    'Social Media': '📱',
    'Games': '🎮',
    'Productivity': '⚡',
    'Utilities': '🔧',
    'Shopping': '🛒',
    'Entertainment': '🎬',
    'Photo & Video': '📷',
    'News': '📰',
    'Music': '🎵',
    'Education': '📚',
    'Health & Fitness': '💪',
    'Travel': '✈️',
    'Finance': '💰',
    'Business': '💼',
    'Lifestyle': '🌟',
    'Sports': '⚽',
    'Food & Drink': '🍕',
    'Books': '📖',
    'Navigation': '🗺️',
    'Communication': '💬',
    'Dating': '❤️',
    'Auto & Vehicles': '🚗',
  };
  
  return {
    name: normalized,
    icon: categoryIcons[normalized] || '📦',
  };
}

/**
 * Check if category is popular
 */
export function isPopularCategory(category: string): boolean {
  return POPULAR_CATEGORIES.includes(normalizeCategory(category));
}

